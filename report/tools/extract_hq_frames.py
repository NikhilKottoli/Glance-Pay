#!/usr/bin/env python3
"""Extract key frames from HQ demo video for narrated slides."""

import subprocess
import imageio_ffmpeg
from pathlib import Path

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
video = "/home/azureuser/Glance-Pay/report/glance-pay-hq-demo.mp4"
out_dir = Path("/home/azureuser/Glance-Pay/report/hq_frames")
out_dir.mkdir(exist_ok=True)

# Timestamps (seconds) for each slide
timestamps = [
    (2.0, "hq-frame-01-dashboard.png"),
    (6.0, "hq-frame-02-connect.png"),
    (12.0, "hq-frame-03-merchant.png"),
    (18.0, "hq-frame-04-amount.png"),
    (24.0, "hq-frame-05-pay.png"),
    (30.0, "hq-frame-06-admin.png"),
    (38.0, "hq-frame-07-network.png"),
    (46.0, "hq-frame-08-g2.png"),
    (54.0, "hq-frame-09-g2-listening.png"),
    (60.0, "hq-frame-10-history.png"),
]

for ts, fname in timestamps:
    out_path = out_dir / fname
    cmd = [
        FFMPEG, "-y", "-ss", str(ts), "-i", video,
        "-vframes", "1", "-q:v", "2",
        str(out_path)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✅ Extracted {fname} at {ts}s")
    else:
        print(f"❌ Failed {fname}: {result.stderr}")

print("\nDone. Frames in:", out_dir)