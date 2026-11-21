#!/usr/bin/env python3
"""G2 narration configuration - loads as JSON."""
import json

NARRATION_CONFIG = {
  "voice": "en-US-GuyNeural",
  "rate": "-5%",
  "slides": [
    {
      "image": "01-idle.png",
      "audio": "01-idle.mp3",
      "text": "Glance Pay running on Even G2 glasses. The lens shows three green text lines: app name, prompt, and hint. No camera, no speaker on the glasses — just text."
    },
    {
      "image": "02-listening.png",
      "audio": "02-listening.mp3",
      "text": "User taps the glasses frame. The app enters LISTENING state. The microphone opens on the glasses, streaming 16 kHz PCM to the phone for STT."
    },
    {
      "image": "03-transcript.png",
      "audio": "03-transcript.mp3",
      "text": "User says: pay twelve fifty. The STT returns the transcript, parsed into 12.50 rupees. The lens updates with the recognized amount."
    },
    {
      "image": "04-pick-merchant.png",
      "audio": "04-pick-merchant.mp3",
      "text": "Two nearby merchants seeded: Cafe X and Blue Tokai. The lens shows a pick list. User scrolls with the ring and taps to select Cafe X."
    },
    {
      "image": "05-confirm.png",
      "audio": "05-confirm.mp3",
      "text": "Confirm screen shows the amount in rupees and USDC, merchant name, and a tap-to-pay prompt. A fresh quote is created at this moment."
    },
    {
      "image": "06-pending.png",
      "audio": "06-pending.mp3",
      "text": "User taps to confirm. The backend signs a real Sepolia USDC transfer with the demo wallet, broadcasts it, and waits for on-chain confirmation."
    },
    {
      "image": "07-success.png",
      "audio": "07-success.mp3",
      "text": "Transaction confirmed on-chain. The lens reads: paid twelve fifty to Cafe X. A receipt is emailed via Resend with the transaction link."
    }
  ]
}

if __name__ == "__main__":
    print(json.dumps(NARRATION_CONFIG, indent=2))