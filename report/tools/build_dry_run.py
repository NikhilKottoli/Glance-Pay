#!/usr/bin/env python3
"""Build dry-run demo video from existing recording + new TTS narration."""

import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts
import imageio_ffmpeg

# Paths
ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / "report"
NARRATION_DIR = REPORT / "dry_run_narration"
SEGMENTS_DIR = REPORT / "dry_run_segments"
NARRATION_JSON = REPORT / "tools" / "human_narration.json"
FINAL_VIDEO = REPORT / "glance-pay-dry-run.mp4"
LIST_FILE = NARRATION_DIR / "concat_list.txt"

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def log(message):
    print(message, flush=True)


def run(cmd, capture=True):
    return subprocess.run(
        cmd,
        check=False,
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


def run_ffmpeg(cmd, capture=True):
    result = subprocess.run(
        cmd,
        check=False,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")
    return result


def main():
    log("🎬 Building dry-run demo video...")
    
    config = load_config()
    voice = config["voice"]
    rate = config.get("rate", "-8%")
    slides = config["slides"]
    
    ensure_dirs()
    
    # Step 1: Generate all MP3s
    log("\n[1/3] Generating narration MP3s...")
    for slide in slides:
        audio_path = NARRATION_DIR / slide["audio"]
        if audio_path.exists() and audio_path.stat().st_size > 0:
            log(f"  reuse MP3   {audio_path.name} ({audio_path.stat().st_size} bytes)")
        else:
            log(f"  synth MP3   {audio_path.name}  voice={voice} rate={rate}")
            communicate = edge_tts.Communicate(slide["text"], voice, rate=rate)
            asyncio.run(communicate.save(str(audio_path)))
            if not audio_path.exists() or audio_path.stat().st_size == 0:
                raise RuntimeError(f"edge-tts failed to produce {audio_path}")
            log(f"  wrote MP3   {audio_path.name} ({audio_path.stat().st_size} bytes)")
    
    # Step 2: Create video segments from webm + audio
    log("\n[2/3] Building video segments...")
    webm_file = "/home/azureuser/Glance-Pay/report/page@dca8352426fd53353a9429d349decb66.webm"
    
    if not Path(webm_file).exists():
        log(f"ERROR: WebM file not found: {webm_file}")
        sys.exit(1)
    
    # Extract frames from webm at specific timestamps and combine with audio
    # For simplicity, we'll create a segment for each slide using the webm as background
    # and overlay the new audio
    
    # First, get the duration of the webm
    result = run([FFMPEG, "-i", "/home/azureuser/Glance-Pay/report/page@dca8352426fd53353a9429d349decb66.webm"])
    log(f"WebM info: {result.stderr[:500]}")
    
    # For a simpler approach, let's just concatenate the existing narrated video
    # with our new audio by creating still frames with audio
    
    log("\n[2/3] Creating segments from existing recording + new audio...")
    segment_paths = []
    
    for index, slide in enumerate(config["slides"], start=1):
        audio_path = NARRATION_DIR / slide["audio"]
        if not audio_path.exists():
            log(f"ERROR: Missing audio: {audio_path}")
            sys.exit(1)
        
        # Create a segment with the webm as background and our audio
        # We'll extract a frame from the webm at the right timestamp
        segment_path = SEGMENTS_DIR / f"{Path(slide['audio']).stem}.mp4"
        
        if segment_path.exists() and segment_path.stat().st_size > 0:
            log(f"  reuse SEG   [{index}/{len(config['slides'])}] {segment_path.name}")
            segment_paths.append(segment_path)
            continue
        
        log(f"  build SEG   [{index}/{len(config['slides'])}] {segment_path.name}")
        
        # Use a single frame from the webm (we'll use the first frame for all)
        # and stretch it to the audio duration
        cmd = [
            FFMPEG, "-y", "-loglevel", "error",
            "-i", "/home/azureuser/Glance-Pay/report/page@dca8352426fd53353a9429d349decb66.webm",
            "-i", str(NARRATION_DIR / slide["audio"]),
            "-c:v", "libx264", "-tune", "stillimage", "-preset", "medium",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
            "-shortest",
            "-movflags", "+faststart",
            str(SEGMENTS_DIR / f"{Path(slide['audio']).stem}.mp4"),
        ]
        result = run_ffmpeg(cmd)
        segment_paths.append(SEGMENTS_DIR / f"{Path(slide['audio']).stem}.mp4")
        log(f"  built SEG   [{index}/{len(config['slides'])}] {segment_path.name}")
    
    # Step 3: Concatenate all segments
    log("\n[3/3] Concatenating final video...")
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
    result = run_ffmpeg(cmd)
    if result.returncode == 0:
        log("  Concatenated with stream copy (-c copy).")
    else:
        log("  Stream-copy concat failed; re-encoding segments on concat...")
        cmd = [
            FFMPEG, "-y", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(LIST_FILE),
            "-c:v", "libx264", "-preset", "medium", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
            "-movflags", "+faststart", str(FINAL_VIDEO),
        ]
        run_ffmpeg(cmd)
        log("  Concatenated with re-encode.")
    
    # Verify
    result = run([FFMPEG, "-hide_banner", "-i", str(FINAL_VIDEO)])
    info = result.stderr or result.stdout
    for line in info.splitlines():
        if "Duration:" in line or "Stream #" in line or "Input #" in line:
            log("  " + line.strip())
    size = FINAL_VIDEO.stat().st_size
    log(f"  Final file: {FINAL_VIDEO}")
    log(f"  File size:  {size} bytes ({size / 1024 / 1024:.2f} MiB)")
    log("\n✅ Dry-run demo video complete!")
    log(f"Video saved to: {FINAL_VIDEO}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)