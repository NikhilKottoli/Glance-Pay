#!/usr/bin/env python3
"""Send the demo video using the Telegram bot config in OpenCode's service.json.

Secrets are read from the config file and never printed.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import send_telegram  # noqa: E402

CONFIG = Path("/root/.config/opencode/service.json")


def main():
    cfg = json.loads(CONFIG.read_text())
    env = cfg.get("env", {})
    token = env.get("BOT_TELEGRAM_TOKEN")
    chat_id = env.get("BOT_TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("Telegram credentials missing from service config.", file=sys.stderr)
        return 2

    video = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "glance-pay-demo.mp4"
    caption = (sys.argv[2] if len(sys.argv) > 2 else send_telegram.CAPTION)
    print(f"Sending {video.name} ({video.stat().st_size} bytes) to chat {chat_id} ...")
    result = send_telegram.send_video(token, str(chat_id), video, caption)
    if result.get("ok"):
        msg = result["result"]
        print(f"Sent. message_id={msg.get('message_id')} chat_id={msg.get('chat', {}).get('id')}")
        return 0
    print(f"Telegram error {result.get('error_code')}: {result.get('description')}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
