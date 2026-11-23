import json

with open('/home/azureuser/Glance-Pay/report/tools/hq_narration.json', 'r') as f:
    data = json.load(f)

# Update image paths to use hq_frames directory
for slide in data["slides"]:
    slide["image"] = slide["image"].replace("hq-frame-", "hq_frames/hq-frame-")

with open('/home/azureuser/Glance-Pay/report/tools/hq_narration.json', 'w') as f:
    json.dump(data, f, indent=2)
print("Updated narration paths")