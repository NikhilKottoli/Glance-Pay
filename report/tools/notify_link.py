#!/usr/bin/env python3
"""Send the live demo link to the configured Telegram chat (no secrets printed)."""
import json
from pathlib import Path
from urllib.request import Request, urlopen

cfg = json.loads(Path("/root/.config/opencode/service.json").read_text())["env"]
token, chat = cfg["BOT_TELEGRAM_TOKEN"], cfg["BOT_TELEGRAM_CHAT_ID"]
text = ("Glance Pay — LIVE deployable demo\n"
        "https://gifts-tumor-repeat-checklist.trycloudflare.com\n\n"
        "User: connect wallet, choose merchant, pay → receipt email via Resend. "
        "Admin tab: onboard merchants and see all receipts. "
        "Testnet-style mock payout — no real money moves. "
        "Link is live while this session's tunnel runs.")
req = Request(
    f"https://api.telegram.org/bot{token}/sendMessage",
    data=json.dumps({"chat_id": chat, "text": text}).encode(),
    headers={"Content-Type": "application/json"},
)
with urlopen(req, timeout=60) as r:
    result = json.loads(r.read().decode())
print("ok:", result.get("ok"), "message_id:", result.get("result", {}).get("message_id"))
