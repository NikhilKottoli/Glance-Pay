#!/usr/bin/env python3
import json, subprocess, os
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image

RPC="http://127.0.0.1:9898"
# clear console, click a few times, capture
for a in ["click","click","click","click"]:
    req=Request(f"{RPC}/api/input",data=json.dumps({"action":a}).encode(),headers={"Content-Type":"application/json"})
    with urlopen(req,timeout=10) as r: pass
    import time; time.sleep(1.5)
p=Path("/home/azureuser/Glance-Pay/screenshots/g2/13-fresh.png")
req=Request(f"{RPC}/api/screenshot/glasses")
with urlopen(req,timeout=10) as r: p.write_bytes(r.read())
im=Image.open(p).convert("RGB")
colors=im.getcolors(maxcolors=100000) or []
colors.sort(reverse=True)
print("size",im.size,"distinct",len(colors))
for c,v in colors[:6]: print(c,v,round(100*v/(im.size[0]*im.size[1]),2),"%")
req=Request(f"{RPC}/api/console")
with urlopen(req,timeout=10) as r: print("console",json.loads(r.read().decode()).get("total"))
