import json
from pathlib import Path

data = {
  "voice": "en-US-AriaNeural",
  "rate": "-5%",
  "slides": [
    {
      "image": "final-frame-01-g2-idle.png",
      "audio": "final-01-g2-idle.mp3",
      "text": "Glance Pay — hands-free stablecoin payments on Even Realities G2 smart glasses. DeFi track, Heads Up hackathon."
    },
    {
      "image": "final-frame-02-g2-listening.png",
      "audio": "final-02-g2-listening.mp3",
      "text": "Part one: the G2 lens app payment flow. The G2 has no camera, no speaker — just a monochrome green display at 576 by 288. Tap the glasses or R1 ring to start listening."
    },
    {
      "image": "final-frame-03-g2-pick-merchant.png",
      "audio": "final-03-g2-pick-merchant.mp3",
      "text": "LISTENING state: raw microphone PCM streams to our backend for speech-to-text. The parser extracts amount and merchant — say 'pay twelve fifty to Café X'."
    },
    {
      "image": "final-frame-04-g2-confirm.png",
      "audio": "final-04-g2-confirm.mp3",
      "text": "PICK_MERCHANT: nearby merchants sorted by GPS distance. Scroll the ring or temple to choose, tap to select. No auto-pay — every transaction is explicit."
    },
    {
      "image": "final-frame-05-g2-pending.png",
      "audio": "final-05-g2-pending.mp3",
      "text": "CONFIRM shows merchant, rupees, and USDC equivalent on one glanceable line. Tap ring or glasses to authorize. Our backend signs a real test USDC transfer on Ethereum Sepolia."
    },
    {
      "image": "final-frame-06-g2-success.png",
      "audio": "final-06-g2-success.mp3",
      "text": "PENDING: on-chain verification polls for the receipt. SUCCESS: verified on-chain, receipt emailed via Resend. The phone panel speaks: 'Payment confirmed.'"
    },
    {
      "image": "final-frame-07-web-dashboard.png",
      "audio": "final-07-web-dashboard.mp3",
      "text": "Part two: the web admin dashboard. Connect MetaMask — auto-switches to Sepolia. Merchant picker shows GPS distances: Café X at fifty meters, Blue Tokai at one-twenty meters."
    },
    {
      "image": "final-frame-08-web-admin.png",
      "audio": "final-08-web-admin.mp3",
      "text": "Admin tab: onboard new merchants with name, GPS coordinates, UPI URI, and category. All stored locally for the demo; production swaps for the payout partner API."
    },
    {
      "image": "final-frame-09-web-network.png",
      "audio": "final-09-web-network.mp3",
      "text": "Network panel: Ethereum Sepolia chain 11155111, USDC contract address, verified on-chain receipts with Etherscan links. Every payment is auditable end-to-end."
    },
    {
      "image": "final-frame-10-architecture.png",
      "audio": "final-10-architecture.mp3",
      "text": "Part three: architecture. G2 lens app talks to Even Hub SDK over Bluetooth. Web panel and G2 app both call the Node backend API. Backend signs real USDC transfers on Sepolia, verifies on-chain via RPC, emails receipts via Resend. No mock path — real on-chain settlement."
    }
  ]
}

with open('/home/azureuser/Glance-Pay/report/tools/final_narration.json', 'w') as f:
    json.dump(data, f, indent=2)
print("Created final_narration.json")