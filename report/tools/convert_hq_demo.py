import subprocess
import imageio_ffmpeg
import os

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
webm = "/home/azureuser/Glance-Pay/report/page@5c88927ff9a470c94381ec75c5703f58.webm"
mp4 = "/home/azureuser/Glance-Pay/report/glance-pay-hq-demo.mp4"

cmd = [
    FFMPEG, "-y", "-i", webm,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18",  # Higher quality
    "-c:a", "aac", "-b:a", "128k",
    mp4
]
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print(f"✅ Converted to MP4: {mp4}")
    print(f"   Size: {os.path.getsize(mp4) / 1024 / 1024:.2f} MB")
else:
    print(f"❌ Conversion failed: {result.stderr}")