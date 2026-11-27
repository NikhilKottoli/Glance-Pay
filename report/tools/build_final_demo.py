#!/usr/bin/env python3
"""Build the 11-slide final demo.

Slides 1-10 reuse the existing narration MP3s. The final architecture slide
gets freshly synthesized audio because its script changed. All segments are
rendered into a clean directory, so no stale MP4 can leak in.
"""

import asyncio
import json
import shutil
import subprocess
from pathlib import Path

import edge_tts
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / "report"
JSON_PATH = REPORT / "tools" / "human_narration.json"
OUT_DIR = REPORT / "final_demo_narration"
SEG_DIR = OUT_DIR / "segments"
FINAL = REPORT / "glance-pay-human-demo.mp4"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def log(message):
    print(message, flush=True)


def run(cmd):
    return subprocess.run(
        cmd, check=False,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SEG_DIR.mkdir(parents=True, exist_ok=True)

    config = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    voice = config["voice"]
    rate = config.get("rate", "+0%")
    slides = config["slides"]
    log(f"Voice: {voice}   Rate: {rate}   Slides: {len(slides)}")

    log("\n[1/3] Narration audio")
    for index, slide in enumerate(slides, start=1):
        dest = OUT_DIR / slide["audio"]
        source = REPORT / "human_narration" / slide["audio"]
        is_final_slide = index == len(slides)
        if not is_final_slide and source.exists() and source.stat().st_size > 0:
            shutil.copy2(source, dest)
            log(f"  copy MP3   {dest.name}")
            continue
        log(f"  synth MP3  {dest.name}")
        asyncio.run(
            edge_tts.Communicate(slide["text"], voice, rate=rate).save(str(dest))
        )
        if not dest.exists() or dest.stat().st_size == 0:
            raise RuntimeError(f"edge-tts failed to produce {dest}")

    log("\n[2/3] Video segments")
    segments = []
    for index, slide in enumerate(slides, start=1):
        image = ROOT / slide["image"]
        audio = OUT_DIR / slide["audio"]
        segment = SEG_DIR / f"{Path(slide['audio']).stem}.mp4"
        if not image.exists():
            raise FileNotFoundError(f"Missing frame: {image}")
        log(f"  build SEG  [{index}/{len(slides)}] {segment.name}")
        cmd = [
            FFMPEG, "-y", "-loglevel", "error",
            "-loop", "1", "-framerate", "30", "-i", str(image),
            "-i", str(audio),
            "-c:v", "libx264", "-tune", "stillimage", "-preset", "medium",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
            "-shortest", "-movflags", "+faststart", str(segment),
        ]
        result = run(cmd)
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg segment failed for {image}:\n{result.stderr}")
        segments.append(segment)

    log("\n[3/3] Concatenate")
    list_file = OUT_DIR / "concat_list.txt"
    list_file.write_text(
        "".join(f"file '{path}'\n" for path in segments), encoding="utf-8"
    )
    result = run([
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-c", "copy", "-movflags", "+faststart", str(FINAL),
    ])
    if result.returncode != 0:
        raise RuntimeError(f"concat failed:\n{result.stderr}")

    info = run([FFMPEG, "-hide_banner", "-i", str(FINAL)])
    for line in (info.stderr or "").splitlines():
        if "Duration:" in line:
            log("  " + line.strip())
    log(f"  Final: {FINAL} ({FINAL.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
