#!/usr/bin/env python3
"""Extract a single frame from a video at a given timestamp.

Usage: extract_video_frame.py <video> <seconds> <out.png>
"""

import subprocess
import sys

import imageio_ffmpeg


def main():
    if len(sys.argv) != 4:
        print("usage: extract_video_frame.py <video> <seconds> <out.png>", file=sys.stderr)
        return 2
    video, seconds, out = sys.argv[1], sys.argv[2], sys.argv[3]
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg, "-y", "-loglevel", "error",
        "-ss", str(seconds), "-i", video,
        "-frames:v", "1", out,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ffmpeg failed: {result.stderr}", file=sys.stderr)
        return 1
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
