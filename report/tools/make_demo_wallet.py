#!/usr/bin/env python3
"""Generate a throwaway testnet-only wallet and store its key in the gitignored .env.

Prints ONLY the address. Never commit the private key.
"""
import os
from pathlib import Path

from eth_account import Account

ROOT = Path(__file__).resolve().parents[2]
ENV = ROOT / ".env"

acct = Account.create()

lines = ENV.read_text().splitlines() if ENV.exists() else []
lines = [l for l in lines if not l.startswith("DEMO_WALLET_PRIVATE_KEY=")]
lines.append(f"DEMO_WALLET_PRIVATE_KEY={acct.key.hex()}")
ENV.write_text("\n".join(lines).rstrip() + "\n")

print("address:", acct.address)
