#!/usr/bin/env python3
import json
from urllib.request import Request, urlopen

ADDR = "0x59038217B2aA85E9c58eaF11bcB2f5BF00D3041b"
USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
RPC = "https://ethereum-sepolia-rpc.publicnode.com"
data = "0x70a08231" + ADDR[2:].lower().zfill(64)

def rpc(method, params):
    req = Request(RPC, data=json.dumps({"jsonrpc":"2.0","id":1,"method":method,"params":params}).encode(),
                  headers={"Content-Type":"application/json","User-Agent":"glance-pay/1.0"})
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

eth = int(rpc("eth_getBalance", [ADDR, "latest"])["result"], 16)
usdc_res = rpc("eth_call", [{"to": USDC, "data": data}, "latest"])
usdc = int(usdc_res["result"], 16) if "result" in usdc_res else usdc_res
nonce = int(rpc("eth_getTransactionCount", [ADDR, "latest"])["result"], 16)
print("ETH:", eth / 1e18)
print("USDC:", usdc / 1e6 if isinstance(usdc, int) else usdc)
print("nonce:", nonce)
