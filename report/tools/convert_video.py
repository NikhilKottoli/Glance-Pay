import subprocess
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
webm = "/home/azureuser/Glance-Pay/report/page@bea9a669355e536029032eaef150fba5.webm"
mp4 = "/home/azureuser/Glance-Pay/report/glance-pay-real-demo.mp4"

cmd = [
    FFMPEG, "-y", "-i", webm,
    "-c:v", "libx264", "-preset", "medium", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    mp4
]
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print(f"✅ Converted to MP4: {mp4}")
    import os
    print(f"   Size: {os.path.getsize(mp4) / 1024 / 1024:.2f} MB")
else:
    print(f"❌ Conversion failed: {result.stderr}")