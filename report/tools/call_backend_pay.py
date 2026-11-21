#!/usr/bin/env python3
import json
from urllib.request import Request, urlopen

TX = "0xaef92c1c43114d09787d7be873b4ae6c3f3322e6482100c533a5c8e689243fcc"
body = json.dumps({"merchantId":"cafe-x","amount":12.5,
                   "wallet":"0x59038217B2aA85E9c58eaF11bcB2f5BF00D3041b","txHash":TX}).encode()
req = Request("http://127.0.0.1:8787/api/pay", data=body,
              headers={"Content-Type":"application/json"})
try:
    with urlopen(req, timeout=120) as r:
        print(json.dumps(json.loads(r.read().decode()), indent=2))
except Exception as e:
    if hasattr(e, "read"):
        print("ERROR:", e.read().decode())
    else:
        raise
