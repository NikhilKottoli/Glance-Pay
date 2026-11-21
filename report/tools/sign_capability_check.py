#!/usr/bin/env python3
"""Prove the stored demo wallet can sign a Base Sepolia USDC transfer.

Does NOT broadcast. Prints only the signed raw-tx length and the recovered signer
address (which must equal the funded address).
"""
from pathlib import Path

from eth_account import Account

ROOT = Path(__file__).resolve().parents[2]
env = dict(
    line.split("=", 1)
    for line in (ROOT / ".env").read_text().splitlines()
    if "=" in line and not line.startswith("#")
)
acct = Account.from_key(env["DEMO_WALLET_PRIVATE_KEY"])

USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
TREASURY = env.get("PAYOUT_TREASURY_ADDRESS", "0x1111111111111111111111111111111111111111")
value = 12_500_000  # 12.50 at 6 decimals
data = "0xa9059cbb" + TREASURY[2:].rjust(64, "0") + format(value, "064x")

signed = acct.sign_transaction(
    {"nonce": 0, "gasPrice": 1_000_000, "gas": 65_000, "to": USDC, "value": 0,
     "data": data, "chainId": 84532}
)
recovered = Account.recover_transaction(signed.raw_transaction.hex())
print("signer (fund this):", acct.address)
print("recovered matches:", recovered.lower() == acct.address.lower())
print("signed raw tx bytes:", len(signed.raw_transaction))
