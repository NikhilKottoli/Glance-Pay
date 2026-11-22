import json

data = {
  "voice": "en-US-AriaNeural",
  "rate": "-5%",
  "slides": [
    {"image": "slides/slide-01.png", "audio": "audio/01-intro.mp3", "text": "Glance Pay — hands-free stablecoin payments on Even Realities G2 smart glasses. Built for the Heads Up hackathon, DeFi track."},
    {"image": "slides/slide-02.png", "audio": "audio/02-g2-intro.mp3", "text": "The G2 puts a private monochrome display in everyday eyewear. No camera, no speaker — just three lines of green text and a ring for input."},
    {"image": "slides/slide-03.png", "audio": "audio/03-voice-input.mp3", "text": "Tap the glasses or R1 ring to listen. Say: pay twelve fifty to Blue Tokai. Raw microphone PCM streams to our backend for speech-to-text, then a parser extracts amount and merchant."},
    {"image": "slides/slide-04.png", "audio": "audio/04-nearby.mp3", "text": "GPS on the phone sorts merchants by distance. Scroll the ring or temple to choose. Tap to confirm. No auto-pay — every transaction is explicit."},
    {"image": "slides/slide-05.png", "audio": "audio/05-confirm.mp3", "text": "The confirm screen shows merchant, rupees, and USDC equivalent on one glanceable line. One tap on the glasses or R1 ring authorizes payment."},
    {"image": "slides/slide-06.png", "audio": "audio/06-onchain.mp3", "text": "Our backend signs a real test USDC transfer on Ethereum Sepolia using a demo wallet, then polls for the on-chain receipt."},
    {"image": "slides/slide-07.png", "audio": "audio/07-verify.mp3", "text": "Verification checks: transaction succeeded, went to the USDC contract, Transfer event credits the treasury, amount matches. Then Resend emails the receipt."},
    {"image": "slides/slide-08.png", "audio": "audio/08-web-panel.mp3", "text": "The phone panel mirrors the lens, shows wallet balances, and speaks the result. Payment of rupees twelve fifty to Blue Tokai confirmed."},
    {"image": "slides/slide-09.png", "audio": "audio/09-admin.mp3", "text": "Admin tab: onboard new merchants with name, GPS coordinates, UPI URI, and category. All payments are verifiable on-chain with Etherscan links."},
    {"image": "slides/slide-10.png", "audio": "audio/10-smart-defaults.mp3", "text": "Smart defaults remember your last payment. Next glance: tap, tap, done. Glance Pay — real on-chain settlement, hands-free on G2."}
  ]
}

with open('/home/azureuser/Glance-Pay/report/tools/g2_demo_narration.json', 'w') as f:
    json.dump(data, f, indent=2)
print("Created g2_demo_narration.json")