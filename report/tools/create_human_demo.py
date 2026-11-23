import json

data = {
  "voice": "en-US-AriaNeural",
  "rate": "-8%",
  "slides": [
    {
      "image": "human-frame-01-scenario.png",
      "audio": "human-01-scenario.mp3",
      "text": "Imagine this: you're at a busy café in Bangalore. You want to pay for your coffee, but your phone is buried in your bag, your hands are full, and the UPI app takes forever to open. You just want to glance, tap, and go."
    },
    {
      "image": "human-frame-02-problem.png",
      "audio": "human-02-problem.mp3",
      "text": "That's the problem Glance Pay solves. Today, every payment means: find phone → unlock → open app → scan QR → enter PIN → wait. On Even Realities G2 smart glasses, we reduce that to: glance at the amount, tap your ring, done. Three seconds instead of thirty."
    },
    {
      "image": "human-frame-03-g2-intro.png",
      "audio": "human-03-g2-intro.mp3",
      "text": "The G2 puts a private monochrome display right in your eyewear — 576 by 288 pixels, green text only. No camera, no speaker. Input comes from the glasses touchpad or the R1 ring on your finger. It's built for glances, not stares."
    },
    {
      "image": "human-frame-04-payment-flow.png",
      "audio": "human-04-payment-flow.mp3",
      "text": "Here's how a payment works. You tap the glasses — the lens shows 'Listening'. You say: 'Pay twelve fifty to Café X'. Raw microphone audio streams to our backend, speech-to-text converts it, and our parser extracts the amount and merchant name."
    },
    {
      "image": "human-frame-05-nearby.png",
      "audio": "human-05-nearby.mp3",
      "text": "The lens now shows nearby merchants sorted by GPS distance — Café X at fifty meters, Blue Tokai at one-twenty meters. You scroll with the ring or temple touchpad, tap to select. No auto-pay, every transaction is explicit."
    },
    {
      "image": "human-frame-06-confirm.png",
      "audio": "human-06-confirm.mp3",
      "text": "Confirm screen shows the merchant, rupees, and USDC equivalent on one line. Tap the ring or glasses to authorize. Our backend signs a real test USDC transfer on Ethereum Sepolia using a demo wallet."
    },
    {
      "image": "human-frame-07-onchain.png",
      "audio": "human-07-onchain.mp3",
      "text": "The transaction hits Ethereum Sepolia testnet — chain ID 11155111. Our backend polls for the receipt, verifies the USDC Transfer event credits the treasury, and the amount matches. This is real on-chain settlement, not a mock."
    },
    {
      "image": "human-frame-08-success.png",
      "audio": "human-08-success.mp3",
      "text": "Success! The lens shows 'Paid twelve fifty to Café X, receipt emailed'. The phone panel speaks: 'Payment of rupees twelve fifty to Café X confirmed.' Every payment is verifiable on Etherscan with a receipt email via Resend."
    },
    {
      "image": "human-frame-09-web-admin.png",
      "audio": "human-09-web-admin.mp3",
      "text": "For merchants and power users, there's a web dashboard. Connect MetaMask — it auto-switches to Sepolia. The merchant picker shows GPS distances so you always know what's nearby. Enter the amount, see the USDC preview, sign and broadcast."
    },
    {
      "image": "human-frame-10-admin-onboard.png",
      "audio": "human-10-admin-onboard.mp3",
      "text": "Admin tab lets you onboard new merchants: name, GPS coordinates, UPI URI, category. In production, this swaps to the payout partner's API. Payment history shows every verified transaction with Etherscan links."
    },
    {
      "image": "human-frame-11-architecture.png",
      "audio": "human-11-architecture.mp3",
      "text": "Under the hood: G2 lens app talks to Even Hub SDK over Bluetooth. Web panel and G2 app both call the Node backend API. Backend signs USDC transfers on Sepolia, verifies on-chain via RPC, emails receipts via Resend. No mock path — real on-chain settlement."
    },
    {
      "image": "human-frame-12-closing.png",
      "audio": "human-12-closing.mp3",
      "text": "Glance Pay — hands-free stablecoin payments on G2 smart glasses. Built for the Heads Up hackathon, DeFi track. Real testnet flow, no mock payments. Glance, tap, done."
    }
  ]
}

with open('/home/azureuser/Glance-Pay/report/tools/human_narration.json', 'w') as f:
    json.dump(data, f, indent=2)
print("Created human_narration.json")