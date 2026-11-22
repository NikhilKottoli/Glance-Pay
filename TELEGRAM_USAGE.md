# Telegram Bot Usage Guide for Glance Pay

## Overview
This project uses a Telegram bot to send demo videos and notifications. The bot is configured in the OpenCode service configuration and accessed via Python scripts.

## Configuration
The bot credentials are stored in `/root/.config/opencode/service.json`:
```json
{
  "env": {
    "BOT_TELEGRAM_TOKEN": "REDACTED_BOT_TOKEN",
    "BOT_TELEGRAM_CHAT_ID": "6641283568"
  }
}
```

## Available Scripts

### 1. Send Video from Config (Recommended)
```bash
python3 report/tools/send_telegram_from_config.py <video_path> [caption]
```
- Reads credentials from service.json automatically
- Example:
```bash
python3 report/tools/send_telegram_from_config.py report/glance-pay-human-demo.mp4 "Glance Pay demo video"
```

### 2. Send Video with Explicit Credentials
```bash
TELEGRAM_BOT_TOKEN=<token> TELEGRAM_CHAT_ID=<chat_id> python3 report/tools/send_telegram.py <video_path>
```

### 3. Send Simple Notification
```bash
python3 report/tools/notify_link.py "Your message here"
```

## Telegram Agent (MCP)
The `telegram-agent` MCP server is configured but has limited tool exposure. Use the Python scripts above for reliable sending.

### MCP Server Config (in opencode.json):
```json
{
  "mcp": {
    "servers": {
      "telegram-agent": {
        "type": "local",
        "command": ["npx", "-y", "mcp-telegram-agent"],
        "environment": {
          "BOT_TELEGRAM_TOKEN": "{env:BOT_TELEGRAM_TOKEN}",
          "BOT_TELEGRAM_CHAT_ID": "{env:BOT_TELEGRAM_CHAT_ID}"
        }
      }
    }
  }
}
```

## For Other Sessions
To use Telegram in another session/terminal:

1. **Copy the service.json** or set environment variables:
```bash
export BOT_TELEGRAM_TOKEN="REDACTED_BOT_TOKEN"
export BOT_TELEGRAM_CHAT_ID="6641283568"
```

2. **Use the send script directly**:
```bash
cd /home/azureuser/Glance-Pay
python3 report/tools/send_telegram.py --video report/glance-pay-human-demo.mp4
```

3. **Or use the config-aware script** (recommended):
```bash
python3 report/tools/send_telegram_from_config.py report/glance-pay-human-demo.mp4 "Your caption"
```

## Troubleshooting
- **File not found**: Ensure video path is correct relative to project root
- **Permission denied**: Check bot token is valid and bot is added to the chat
- **File too large**: Telegram limit is 50MB for bots; compress video if needed
- **Rate limited**: Wait before sending multiple files

## Video Compression (if needed)
```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 output.mp4
```