import json
from pathlib import Path

with open('/home/azureuser/Glance-Pay/report/tools/final_narration.json', 'r') as f:
    data = json.load(f)

for slide in data["slides"]:
    fname = Path(slide["image"]).name
    slide["image"] = f"report/final_frames/{fname}"

with open('/home/azureuser/Glance-Pay/report/tools/final_narration.json', 'w') as f:
    json.dump(data, f, indent=2)
print("Fixed final narration paths")