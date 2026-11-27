#!/usr/bin/env python3
"""Print cumulative start times for each segment in the rebuild directory.

Parses ffmpeg -i output for each segment and reports the start offset of every
slide, so the architecture slide frame can be extracted from the final video.
"""

import re
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[2]
SEGMENTS = (
    Path(sys.argv[1])
    if len(sys.argv) > 1
    else ROOT / "report" / "human_narration" / "segments_rebuild"
)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

DUR_RE = re.compile(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)")


def duration_of(path):
    result = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", str(path)],
        capture_output=True, text=True,
    )
    match = DUR_RE.search(result.stderr)
    if not match:
        return None
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def main():
    files = sorted(SEGMENTS.glob("*.mp4"))
    if not files:
        print(f"no segments in {SEGMENTS}", file=sys.stderr)
        return 1
    elapsed = 0.0
    print(f"{'start':>8}  {'dur':>7}  segment")
    for path in files:
        dur = duration_of(path)
        if dur is None:
            print(f"{'?':>8}  {'?':>7}  {path.name}")
            continue
        print(f"{elapsed:8.2f}  {dur:7.2f}  {path.name}")
        elapsed += dur
    print(f"{'TOTAL':>8}  {elapsed:7.2f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
