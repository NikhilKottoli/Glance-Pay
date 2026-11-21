#!/usr/bin/env python3
"""Build the final <=3 min narrated G2 demo video.

Pipeline:
  1. Synthesize 8 MP3 narrations with free edge-tts (en-US-GuyNeural, -8%).
  2. Build one 1280x720 still + audio segment per slide (libx264/aac, -shortest).
  3. Concatenate into report/glance-pay-g2-final.mp4 with +faststart.
  4. Verify stream layout and duration (<=180s).

Idempotent: existing non-empty MP3/segment files are reused.
"""

import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts
import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
REPORT = HERE.parent
AUDIO_DIR = HERE / "audio"
SEGMENTS_DIR = HERE / "segments"
NARRATION_JSON = HERE / "narration.json"
LIST_FILE = HERE / "concat_list.txt"
FINAL_VIDEO = REPORT / "glance-pay-g2-final.mp4"

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def log(msg):
    print(msg, flush=True)


def run(cmd, capture=True):
    return subprocess.run(
        cmd,
        check=False,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        text=True,
    )


def ensure_dirs():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    SEGMENTS_DIR.mkdir(parents=True, exist_ok=True)


def generate_mp3(slide, voice, rate):
    audio_path = AUDIO_DIR / Path(slide["audio"]).name
    if audio_path.exists() and audio_path.stat().st_size > 0:
        log(f"  reuse MP3   {audio_path.name} ({audio_path.stat().st_size} bytes)")
        return audio_path
    log(f"  synth MP3   {audio_path.name}  voice={voice} rate={rate}")
    communicate = edge_tts.Communicate(slide["text"], voice, rate=rate)
    asyncio.run(communicate.save(str(audio_path)))
    if not audio_path.exists() or audio_path.stat().st_size == 0:
        raise RuntimeError(f"edge-tts failed to produce {audio_path}")
    log(f"  wrote MP3   {audio_path.name} ({audio_path.stat().st_size} bytes)")
    return audio_path


def build_segment(slide, index, total):
    image_path = HERE / slide["image"]
    audio_path = AUDIO_DIR / Path(slide["audio"]).name
    if not image_path.exists():
        raise FileNotFoundError(f"Missing image: {image_path}")
    if not audio_path.exists():
        raise FileNotFoundError(f"Missing audio: {audio_path}")

    segment_path = SEGMENTS_DIR / f"{Path(slide['audio']).stem}.mp4"
    if segment_path.exists() and segment_path.stat().st_size > 0:
        log(f"  reuse SEG   [{index}/{total}] {segment_path.name}")
        return segment_path

    log(f"  build SEG   [{index}/{total}] {image_path.name}")
    cmd = [
        FFMPEG, "-y", "-loglevel", "error",
        "-loop", "1", "-framerate", "30",
        "-i", str(image_path),
        "-i", str(audio_path),
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-preset", "medium",
        "-s", "1280x720",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "160k",
        "-ar", "48000",
        "-ac", "2",
        "-shortest",
        "-movflags", "+faststart",
        str(segment_path),
    ]
    result = run(cmd)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg segment failed for {image_path}:\n{result.stderr}")
    return segment_path


def build_final(segment_paths):
    with LIST_FILE.open("w", encoding="utf-8") as handle:
        for path in segment_paths:
            handle.write(f"file '{path}'\n")
    log(f"  Wrote concat list: {LIST_FILE} ({len(segment_paths)} entries)")

    cmd = [
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0",
        "-i", str(LIST_FILE),
        "-c", "copy",
        "-movflags", "+faststart",
        str(FINAL_VIDEO),
    ]
    result = run(cmd)
    if result.returncode == 0:
        log("  Concatenated with stream copy (-c copy).")
        return

    log("  Stream-copy concat failed; re-encoding on concat...")
    cmd = [
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0",
        "-i", str(LIST_FILE),
        "-c:v", "libx264", "-preset", "medium", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart",
        str(FINAL_VIDEO),
    ]
    result = run(cmd)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg concat failed:\n{result.stderr}")
    log("  Concatenated with re-encode.")


def parse_duration(text):
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", text)
    if not m:
        return None
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def verify():
    log("\n--- Verification: ffmpeg -i ---")
    result = run([FFMPEG, "-hide_banner", "-i", str(FINAL_VIDEO)])
    info = result.stderr or result.stdout
    for line in info.splitlines():
        if "Duration:" in line or "Stream #" in line or "Input #" in line:
            log("  " + line.strip())
    size = FINAL_VIDEO.stat().st_size
    dur = parse_duration(info)
    log(f"  Final file: {FINAL_VIDEO}")
    log(f"  File size:  {size} bytes ({size / 1024 / 1024:.2f} MiB)")
    log(f"  Duration:   {dur if dur is not None else 'UNKNOWN'} seconds")
    if dur is None:
        raise RuntimeError("Could not parse duration from ffmpeg output")
    if dur <= 0:
        raise RuntimeError("Video duration is zero")
    if dur > 180:
        raise RuntimeError(f"Video too long: {dur:.1f}s > 180s")
    if not FINAL_VIDEO.exists() or size == 0:
        raise RuntimeError("Final video missing or empty")
    return {"duration": dur, "size": size}


def main():
    log(f"ffmpeg binary: {FFMPEG}")
    ensure_dirs()
    config = json.loads(NARRATION_JSON.read_text(encoding="utf-8"))
    voice = config["voice"]
    rate = config.get("rate", "+0%")
    slides = config["slides"]
    log(f"Voice: {voice}   Rate: {rate}   Slides: {len(slides)}")

    log("\n[1/3] Narration MP3s")
    for slide in slides:
        generate_mp3(slide, voice, rate)

    log("\n[2/3] Video segments")
    segment_paths = []
    for i, slide in enumerate(slides, start=1):
        segment_paths.append(build_segment(slide, i, len(slides)))

    log("\n[3/3] Concatenate final video")
    build_final(segment_paths)
    stats = verify()
    log(f"\nDone. duration={stats['duration']:.1f}s size={stats['size']} bytes")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)
