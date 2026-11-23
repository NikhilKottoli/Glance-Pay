import json
from pathlib import Path

with open('/home/azureuser/Glance-Pay/report/tools/hq_narration.json', 'r') as f:
    data = json.load(f)

# Fix image paths - frames are in report/hq_frames/
for slide in data["slides"]:
    fname = Path(slide["image"]).name
    slide["image"] = f"report/hq_frames/{fname}"

with open('/home/azureuser/Glance-Pay/report/tools/hq_narration.json', 'w') as f:
    json.dump(data, f, indent=2)
print("Fixed narration paths")