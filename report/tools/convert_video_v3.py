import subprocess
import imageio_ffmpeg
import os

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
webm = "/home/azureuser/Glance-Pay/report/page@15b3a87de2daaaa7c9a63278638989f6.webm"
mp4 = "/home/azureuser/Glance-Pay/report/glance-pay-real-demo-final.mp4"

cmd = [
    FFMPEG, "-y", "-i", webm,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-c:a", "aac", "-b:a", "128k",
    mp4
]
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print(f"✅ Converted to MP4: {mp4}")
    print(f"   Size: {os.path.getsize(mp4) / 1024 / 1024:.2f} MB")
else:
    print(f"❌ Conversion failed: {result.stderr}")