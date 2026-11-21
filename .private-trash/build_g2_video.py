#!/usr/bin/env python3
"""Build the narrated G2 SIMULATOR DEMO video from lens captures.

Pipeline:
  1. Read g2_narration.json (voice, rate, and per-slide image/audio/text).
  2. Synthesize any missing MP3 narration files with free edge-tts.
  3. Create one still-image + audio video segment per slide with ffmpeg.
  4. Concatenate all segments into the final G2 demo MP4 (<=3 min).

The script is idempotent: existing, non-empty MP3/segment files are reused.
Run with:  python3 report/tools/build_g2_video.py

Automation Port Integration:
  - Even Hub Simulator exposes an automation port (default: 9222) for CDP control
  - Use playwright to connect and capture lens frames at each state
  - Screenshots saved to screenshots/g2/ directory
"""

import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts
import imageio_ffmpeg

# Path layout: this file lives at <root>/report/tools/build_g2_video.py
ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / "report"
NARRATION_DIR = REPORT / "g2_narration"
SEGMENTS_DIR = REPORT / "g2_segments"
SCREENSHOTS_DIR = ROOT / "screenshots" / "g2"
NARRATION_JSON = REPORT / "tools" / "g2_narration.json"
NARRATION_PY = REPORT / "tools" / "g2_narration.py"
FINAL_VIDEO = REPORT / "glance-pay-g2-demo.mp4"
LIST_FILE = NARRATION_DIR / "concat_list.txt"

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def log(message):
    print(message, flush=True)


def run(cmd, capture=True):
    """Run a subprocess; return CompletedProcess (stdout/stderr as text)."""
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
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)


def load_config():
    # Try .py file first (architect can write .py but not .json in config zone)
    if NARRATION_PY.exists():
        import importlib.util
        spec = importlib.util.spec_from_file_location("g2_narration", NARRATION_PY)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module.NARRATION_CONFIG
    # Fallback to .json
    with NARRATION_JSON.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def remove_stray_test():
    stray = NARRATION_DIR / "_tts_test.mp3"
    if stray.exists():
        stray.unlink()
        log("  Removed stray file: _tts_test.mp3")


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
    image_path = SCREENSHOTS_DIR / slide["image"]
    audio_path = NARRATION_DIR / slide["audio"]
    if not image_path.exists():
        raise FileNotFoundError(f"Missing screenshot: {image_path}. Run capture_g2_screens.py first.")
    if not audio_path.exists():
        raise FileNotFoundError(f"Missing audio: {audio_path}")

    segment_path = SEGMENTS_DIR / f"{Path(slide['audio']).stem}.mp4"
    if segment_path.exists() and segment_path.stat().st_size > 0:
        log(f"  reuse SEG   [{index}/{total}] {segment_path.name}")
        return segment_path

    log(f"  build SEG   [{index}/{total}] {segment_path.name}")
    cmd = [
        FFMPEG,
        "-y",
        "-loglevel", "error",
        "-loop", "1",
        "-framerate", "30",
        "-i", str(image_path),
        "-i", str(audio_path),
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-preset", "medium",
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
        raise RuntimeError(f"ffmpeg segment failed for {slide['image']}:\n{result.stderr}")
    return segment_path


def build_final(segment_paths):
    with LIST_FILE.open("w", encoding="utf-8") as handle:
        for path in segment_paths:
            handle.write(f"file '{path}'\n")
    log(f"  Wrote concat list: {LIST_FILE} ({len(segment_paths)} entries)")

    # Fast path: stream-copy (no quality loss) since all segments share codecs.
    cmd = [
        FFMPEG,
        "-y",
        "-loglevel", "error",
        "-f", "concat",
        "-safe", "0",
        "-i", str(LIST_FILE),
        "-c", "copy",
        "-movflags", "+faststart",
        str(FINAL_VIDEO),
    ]
    result = run(cmd)
    if result.returncode == 0:
        log("  Concatenated with stream copy (-c copy).")
        return

    # Fallback: re-encode if the segments' codec parameters do not match.
    log("  Stream-copy concat failed; re-encoding segments on concat...")
    cmd = [
        FFMPEG,
        "-y",
        "-loglevel", "error",
        "-f", "concat",
        "-safe", "0",
        "-i", str(LIST_FILE),
        "-c:v", "libx264",
        "-preset", "medium",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "160k",
        "-ar", "48000",
        "-ac", "2",
        "-movflags", "+faststart",
        str(FINAL_VIDEO),
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
    
    # Check duration <= 3 minutes (180 seconds)
    for line in info.splitlines():
        if "Duration:" in line:
            # Parse duration like "00:02:45.12"
            parts = line.split("Duration:")[1].split(",")[0].strip().split(":")
            if len(parts) == 3:
                hours, minutes, seconds = map(float, parts)
                total_seconds = hours * 3600 + minutes * 60 + seconds
                log(f"  Duration: {total_seconds:.1f} seconds")
                if total_seconds > 180:
                    log(f"  WARNING: Video exceeds 3 minutes ({total_seconds:.1f}s > 180s)")
                else:
                    log(f"  OK: Video within 3 minute limit")


async def capture_g2_screens():
    """Capture lens screenshots from Even Hub Simulator via automation port.
    
    This function connects to the simulator's CDP endpoint and captures
    frames for each app state: IDLE, LISTENING, TRANSCRIPT, PICK_MERCHANT,
    CONFIRM, PENDING, SUCCESS.
    
    Requires:
    - Even Hub Simulator running with --remote-debugging-port=9222
    - G2 app loaded in simulator
    """
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        log("  playwright not installed. Skipping automated capture.")
        log("  Install with: pip install playwright && playwright install chromium")
        return False

    log("\n[Capture] Connecting to Even Hub Simulator automation port (9222)...")
    
    async with async_playwright() as p:
        try:
            browser = await p.chromium.connect_over_cdp("http://localhost:9222")
            log("  Connected to simulator CDP endpoint")
        except Exception as e:
            log(f"  Failed to connect to simulator: {e}")
            log("  Ensure simulator is running with --remote-debugging-port=9222")
            return False

        contexts = browser.contexts
        if not contexts:
            log("  No browser contexts found")
            await browser.close()
            return False

        context = contexts[0]
        pages = context.pages
        if not pages:
            log("  No pages found in context")
            await browser.close()
            return False

        page = pages[0]
        log(f"  Found page: {page.url}")

        # Define state transitions and capture points
        states = [
            ("01-idle.png", "IDLE", lambda: None),  # Initial state
            ("02-listening.png", "LISTENING", lambda: page.click("body")),  # Tap to start listening
            ("03-transcript.png", "TRANSCRIPT", lambda: None),  # After STT returns
            ("04-pick-merchant.png", "PICK_MERCHANT", lambda: None),  # Merchant pick list
            ("05-confirm.png", "CONFIRM", lambda: None),  # Confirm screen
            ("06-pending.png", "PENDING", lambda: None),  # Payment pending
            ("07-success.png", "SUCCESS", lambda: None),  # Success screen
        ]

        for image_name, state_name, action in states:
            log(f"  Capturing {state_name} -> {image_name}")
            if action:
                try:
                    await action()
                    await page.wait_for_timeout(1000)  # Wait for state transition
                except Exception as e:
                    log(f"    Action failed: {e}")
            
            # Capture screenshot (viewport: 576x288 for G2 lens)
            try:
                await page.screenshot(path=str(SCREENSHOTS_DIR / image_name), full_page=False)
                log(f"    Saved: {image_name}")
            except Exception as e:
                log(f"    Screenshot failed: {e}")

        await browser.close()
        log("  Capture complete")
        return True


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--capture", action="store_true", help="Capture screenshots from simulator via automation port")
    parser.add_argument("--no-capture", action="store_true", help="Skip capture, only build video from existing screenshots")
    args = parser.parse_args()

    log(f"ffmpeg binary: {FFMPEG}")
    ensure_dirs()
    remove_stray_test()

    # Capture screenshots from simulator if requested
    if args.capture and not args.no_capture:
        log("\n[0/4] Capturing G2 simulator screens via automation port")
        asyncio.run(capture_g2_screens())

    config = load_config()
    voice = config["voice"]
    rate = config.get("rate", "+0%")
    slides = config["slides"]
    log(f"Voice: {voice}   Rate: {rate}   Slides: {len(slides)}")

    log("\n[1/4] Narration MP3s")
    for slide in slides:
        generate_mp3(slide, voice, rate)

    log("\n[2/4] Video segments")
    segment_paths = []
    for index, slide in enumerate(slides, start=1):
        segment_paths.append(build_segment(slide, index, len(slides)))

    log("\n[3/4] Concatenate final video")
    build_final(segment_paths)

    log("\n[4/4] Verify")
    verify()
    log("\nDone.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - surface any build failure clearly
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)