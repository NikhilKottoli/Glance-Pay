import subprocess
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
result = subprocess.run([FFMPEG, '-i', '/home/azureuser/Glance-Pay/report/glance-pay-proper-demo.mp4'], capture_output=True, text=True)
print(result.stderr)