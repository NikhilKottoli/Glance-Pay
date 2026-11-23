#!/usr/bin/env python3
"""Build narrated demo MP4 from HQ demo frames + edge-tts narration."""

import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / "report"
NARRATION_DIR = REPORT / "hq_narration"
SEGMENTS_DIR = NARRATION_DIR / "segments"
FRAMES_DIR = REPORT / "hq_frames"
NARRATION_JSON = REPORT / "tools" / "hq_narration.json"
FINAL_VIDEO = REPORT / "glance-pay-hq-narrated.mp4"
LIST_FILE = NARRATION_DIR / "concat_list.txt"

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def log(message):
    print(message, flush=True)


def run(cmd, capture=True):
    return subprocess.run(
        cmd, check=False,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        text=True,
    )


def ensure_dirs():
    NARRATION_DIR.mkdir(parents=True, exist_ok=True)
    SEGMENTS_DIR.mkdir(parents=True, exist_ok=True)


def load_config():
    with NARRATION_JSON.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def generate_mp3(slide, voice, rate):
    audio_path = NARRATION_DIR / slide["audio"]
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
    image_path = ROOT / slide["image"]
    audio_path = NARRATION_DIR / slide["audio"]
    if not image_path.exists():
        raise FileNotFoundError(f"Missing frame: {image_path}")
    if not audio_path.exists():
        raise FileNotFoundError(f"Missing audio: {audio_path}")

    segment_path = SEGMENTS_DIR / f"{Path(slide['audio']).stem}.mp4"
    if segment_path.exists() and segment_path.stat().st_size > 0:
        log(f"  reuse SEG   [{index}/{total}] {segment_path.name}")
        return segment_path

    log(f"  build SEG   [{index}/{total}] {segment_path.name}")
    cmd = [
        FFMPEG, "-y", "-loglevel", "error",
        "-loop", "1", "-framerate", "30",
        "-i", str(image_path),
        "-i", str(audio_path),
        "-c:v", "libx264", "-tune", "stillimage", "-preset", "medium",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
        "-shortest", "-movflags", "+faststart",
        str(segment_path),
    ]
    result = run(cmd)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg segment failed for {slide['image']}:\n{result.stderr}")
    return segment_path


def build_final(segment_paths):
    with LIST_FILE.open("w", encoding="utf-8") as handle:
        for path in segment_paths:
            handle.write(f"file '{path}'\n")
    log(f"  Wrote concat list: {LIST_FILE} ({len(segment_paths)} entries)")

    cmd = [
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(LIST_FILE),
        "-c", "copy", "-movflags", "+faststart",
        str(FINAL_VIDEO),
    ]
    result = run(cmd)
    if result.returncode == 0:
        log("  Concatenated with stream copy (-c copy).")
        return

    log("  Stream-copy concat failed; re-encoding...")
    cmd = [
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(LIST_FILE),
        "-c:v", "libx264", "-preset", "medium", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart", str(FINAL_VIDEO),
    ]
    result = run(cmd)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg concat failed:\n{result.stderr}")
    log("  Concatenated with re-encode.")


def verify():
    log("\n--- Verification: ffmpeg -i ---")
    result = run([FFMPEG, "-hide_banner", "-i", str(FINAL_VIDEO)])
    info = result.stderr or result.stdout
    for line in info.splitlines():
        if "Duration:" in line or "Stream #" in line or "Input #" in line:
            log("  " + line.strip())
    size = FINAL_VIDEO.stat().st_size
    log(f"  Final file: {FINAL_VIDEO}")
    log(f"  File size:  {size} bytes ({size / 1024 / 1024:.2f} MiB)")


def main():
    log(f"ffmpeg binary: {FFMPEG}")
    ensure_dirs()

    config = load_config()
    voice = config["voice"]
    rate = config.get("rate", "+0%")
    slides = config["slides"]
    log(f"Voice: {voice}   Rate: {rate}   Slides: {len(slides)}")

    log("\n[1/3] Narration MP3s")
    for slide in slides:
        generate_mp3(slide, voice, rate)

    log("\n[2/3] Video segments")
    segment_paths = []
    for index, slide in enumerate(slides, start=1):
        segment_paths.append(build_segment(slide, index, len(slides)))

    log("\n[3/3] Concatenate final video")
    build_final(segment_paths)

    verify()
    log("\nDone.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)