#!/usr/bin/env python3
"""Trigger a real vendor payment through the G2 app's backend endpoint."""
import json
from urllib.request import Request, urlopen

body = json.dumps({"merchantId": "cafe-x", "amountInr": 12.5}).encode()
req = Request("http://127.0.0.1:8787/api/demo-sign-and-pay", data=body,
              headers={"Content-Type": "application/json"})
try:
    with urlopen(req, timeout=180) as r:
        print(json.dumps(json.loads(r.read().decode()), indent=2))
except Exception as e:
    if hasattr(e, "read"):
        print("ERROR:", e.read().decode())
    else:
        raise
