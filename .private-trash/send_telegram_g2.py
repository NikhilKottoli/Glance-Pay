#!/usr/bin/env python3
"""Send the G2 simulator demo video via the Telegram Bot API.

Requires (environment variables or CLI flags):
  TELEGRAM_BOT_TOKEN   token from @BotFather
  TELEGRAM_CHAT_ID     your chat ID (or @channelusername)

Example:
  TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... python3 report/tools/send_telegram_g2.py

No token/chat ID is printed or stored by this script.
"""
import argparse
import json
import os
import sys
import uuid
from pathlib import Path
from urllib.request import Request, urlopen

DEFAULT_VIDEO = Path(__file__).resolve().parents[1] / "glance-pay-g2-demo.mp4"
CAPTION = ("Glance Pay G2 — narrated simulator demo (7 slides, ≤3 min). "
           "Real Sepolia USDC payment, on-chain verification, Resend receipt.")

API_TIMEOUT = 60
UPLOAD_TIMEOUT = 300


def api(token, method, payload):
    url = f"https://api.telegram.org/bot{token}/{method}"
    req = Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urlopen(req, timeout=API_TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def send_video(token, chat_id, video, caption):
    boundary = "----glancepayg2" + uuid.uuid4().hex
    fields = {
        "chat_id": chat_id,
        "caption": caption,
        "supports_streaming": "true",
    }
    chunks = []
    for key, value in fields.items():
        chunks.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{value}\r\n".encode()
        )
    chunks.append(
        (f"--{boundary}\r\nContent-Disposition: form-data; name=\"video\"; "
         f"filename=\"{video.name}\"\r\nContent-Type: video/mp4\r\n\r\n").encode()
    )
    chunks.append(video.read_bytes())
    chunks.append(f"\r\n--{boundary}--\r\n".encode())
    body = b"".join(chunks)
    url = f"https://api.telegram.org/bot{token}/sendVideo"
    req = Request(url, data=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urlopen(req, timeout=UPLOAD_TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--token", default=os.environ.get("TELEGRAM_BOT_TOKEN"))
    p.add_argument("--chat", default=os.environ.get("TELEGRAM_CHAT_ID"))
    p.add_argument("--video", type=Path, default=DEFAULT_VIDEO)
    args = p.parse_args()

    if not args.token or not args.chat:
        print("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID.", file=sys.stderr)
        return 2
    if not args.video.is_file():
        print(f"Video not found: {args.video}", file=sys.stderr)
        return 2

    print(f"Sending {args.video.name} ({args.video.stat().st_size} bytes) ...")
    result = send_video(args.token, args.chat, args.video, CAPTION)
    if result.get("ok"):
        msg = result["result"]
        print(f"Sent. message_id={msg.get('message_id')} chat_id={msg.get('chat', {}).get('id')}")
        return 0
    print(f"Telegram error {result.get('error_code')}: {result.get('description')}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())