#!/usr/bin/env python3
"""Sign and broadcast a real USDC transfer from the dev wallet, then wait for mining.

Uses the locally stored (gitignored) private key. No browser wallet needed.
"""
import json
import os
import time
from pathlib import Path
from urllib.request import Request, urlopen

from eth_account import Account

ROOT = Path(__file__).resolve().parents[2]
env = dict(l.split("=", 1) for l in (ROOT / ".env").read_text().splitlines()
           if "=" in l and not l.startswith("#"))
acct = Account.from_key(env["DEMO_WALLET_PRIVATE_KEY"])
USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
TREASURY = env.get("PAYOUT_TREASURY_ADDRESS", "0x1111111111111111111111111111111111111111")
RPC = "https://ethereum-sepolia-rpc.publicnode.com"
AMOUNT_INR = float(os.environ.get("PAY_AMOUNT_INR", "12.50"))
AMOUNT_UNITS = int(round(AMOUNT_INR * 1_000_000 / 83))  # backend uses same 83 INR/USD rate

def rpc(method, params):
    req = Request(RPC, data=json.dumps({"jsonrpc":"2.0","id":1,"method":method,"params":params}).encode(),
                  headers={"Content-Type":"application/json","User-Agent":"glance-pay/1.0"})
    with urlopen(req, timeout=30) as r:
        res = json.loads(r.read().decode())
    if "error" in res:
        raise RuntimeError(res["error"])
    return res["result"]

nonce = int(rpc("eth_getTransactionCount", [acct.address, "latest"]), 16)
gas_price = int(rpc("eth_gasPrice", []), 16)
balance = int(rpc("eth_getBalance", [acct.address, "latest"]), 16)
data = "0xa9059cbb" + TREASURY[2:].lower().zfill(64) + format(AMOUNT_UNITS, "064x")
gas = int(rpc("eth_estimateGas", [{"from": acct.address, "to": USDC, "data": data}]), 16)
est_cost = gas * gas_price
if balance < est_cost:
    raise RuntimeError(f"insufficient ETH for gas: need {est_cost}, have {balance}")

signed = acct.sign_transaction({"nonce": nonce, "gasPrice": gas_price, "gas": gas,
    "to": USDC, "value": 0, "data": data, "chainId": 11155111})
tx_hash = rpc("eth_sendRawTransaction", [signed.raw_transaction.hex()])
print("SIGNED+SUBMITTED:", tx_hash)
print("from:", acct.address, "amount INR:", AMOUNT_INR, "USDC units:", AMOUNT_UNITS)

for i in range(40):
    receipt = rpc("eth_getTransactionReceipt", [tx_hash])
    if receipt:
        print("MINED: status", receipt["status"], "block", receipt["blockNumber"], "gas", receipt["gasUsed"])
        print("TXHASH_FOR_BACKEND:", tx_hash)
        break
    time.sleep(2)
else:
    print("still pending after 80s:", tx_hash)
