#!/usr/bin/env python3
import json
from urllib.request import urlopen
with urlopen("http://127.0.0.1:8787/api/payments", timeout=10) as r:
    d = json.loads(r.read().decode())
real = [p for p in d["payments"] if p.get("state") == "RELEASED" and str(p.get("txHash", "")).startswith("0x") and p.get("emailId")]
print("count", len(real))
for p in real[:3]:
    print(p["time"], p["txHash"], p["emailId"], p.get("merchant"))
