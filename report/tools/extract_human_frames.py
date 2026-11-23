#!/usr/bin/env python3
"""Extract key frames from final demo video for human narrated slides."""

import subprocess
import imageio_ffmpeg
from pathlib import Path

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
video = "/home/azureuser/Glance-Pay/report/glance-pay-final-demo.mp4"
out_dir = Path("/home/azureuser/Glance-Pay/report/human_frames")
out_dir.mkdir(exist_ok=True)

# Timestamps (seconds) aligned with human narration
timestamps = [
    (1.0, "human-frame-01-scenario.png"),
    (4.0, "human-frame-02-problem.png"),
    (8.0, "human-frame-03-g2-intro.png"),
    (12.0, "human-frame-04-payment-flow.png"),
    (16.0, "human-frame-05-nearby.png"),
    (20.0, "human-frame-06-confirm.png"),
    (26.0, "human-frame-07-onchain.png"),
    (32.0, "human-frame-08-success.png"),
    (40.0, "human-frame-09-web-admin.png"),
    (50.0, "human-frame-10-admin-onboard.png"),
    (60.0, "human-frame-11-architecture.png"),
    (70.0, "human-frame-12-closing.png"),
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