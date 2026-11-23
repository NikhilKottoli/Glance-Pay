#!/usr/bin/env python3
"""Extract key frames from final demo video for narrated slides."""

import subprocess
import imageio_ffmpeg
from pathlib import Path

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
video = "/home/azureuser/Glance-Pay/report/glance-pay-final-demo.mp4"
out_dir = Path("/home/azureuser/Glance-Pay/report/final_frames")
out_dir.mkdir(exist_ok=True)

# Timestamps (seconds) for each slide - aligned with the demo flow
timestamps = [
    (2.0, "final-frame-01-g2-idle.png"),
    (6.0, "final-frame-02-g2-listening.png"),
    (12.0, "final-frame-03-g2-pick-merchant.png"),
    (18.0, "final-frame-04-g2-confirm.png"),
    (24.0, "final-frame-05-g2-pending.png"),
    (32.0, "final-frame-06-g2-success.png"),
    (40.0, "final-frame-07-web-dashboard.png"),
    (50.0, "final-frame-08-web-admin.png"),
    (60.0, "final-frame-09-web-network.png"),
    (70.0, "final-frame-10-architecture.png"),
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