# Glance Pay G2 — Demo Script (Human-Friendly Narrated Demo)

**Duration:** ~4:03 | **Voice:** AriaNeural at -8% rate | **Resolution:** 1920×1080

---

## Slide 1 — Scenario (0:00–0:20)
**Visual:** Café scene / G2 lens IDLE state
**Audio:** `human-01-scenario.mp3`

> "Imagine this: you're at a busy café in Bangalore. You want to pay for your coffee, but your phone is buried in your bag, your hands are full, and the UPI app takes forever to open. You just want to glance, tap, and go."

---

## Slide 2 — The Problem (0:20–0:40)
**Visual:** Phone struggle / current UPI flow
**Audio:** `human-02-problem.mp3`

> "That's the problem Glance Pay solves. Today, every payment means: find phone → unlock → open app → scan QR → enter PIN → wait. On Even Realities G2 smart glasses, we reduce that to: glance at the amount, tap your ring, done. Three seconds instead of thirty."

---

## Slide 3 — G2 Introduction (0:40–1:00)
**Visual:** G2 glasses close-up / lens display
**Audio:** `human-03-g2-intro.mp3`

> "The G2 puts a private monochrome display right in your eyewear — 576 by 288 pixels, green text only. No camera, no speaker. Input comes from the glasses touchpad or the R1 ring on your finger. It's built for glances, not stares."

---

## Slide 4 — Payment Flow Overview (1:00–1:20)
**Visual:** G2 lens LISTENING state
**Audio:** `human-04-payment-flow.mp3`

> "Here's how a payment works. You tap the glasses — the lens shows 'Listening'. You say: 'Pay twelve fifty to Café X'. Raw microphone audio streams to our backend, speech-to-text converts it, and our parser extracts the amount and merchant name."

---

## Slide 5 — GPS Nearby Merchants (1:20–1:40)
**Visual:** PICK_MERCHANT state with distances
**Audio:** `human-05-nearby.mp3`

> "The lens now shows nearby merchants sorted by GPS distance — Café X at fifty meters, Blue Tokai at one-twenty meters. You scroll with the ring or temple touchpad, tap to select. No auto-pay, every transaction is explicit."

---

## Slide 6 — Confirm Screen (1:40–2:00)
**Visual:** CONFIRM state with merchant, INR, USDC
**Audio:** `human-06-confirm.mp3`

> "Confirm screen shows the merchant, rupees, and USDC equivalent on one line. Tap the ring or glasses to authorize. Our backend signs a real test USDC transfer on Ethereum Sepolia using a demo wallet."

---

## Slide 7 — On-Chain Settlement (2:00–2:20)
**Visual:** PENDING state / Sepolia chain
**Audio:** `human-07-onchain.mp3`

> "The transaction hits Ethereum Sepolia testnet — chain ID 11155111. Our backend polls for the receipt, verifies the USDC Transfer event credits the treasury, and the amount matches. This is real on-chain settlement, not a mock."

---

## Slide 8 — Success (2:20–2:40)
**Visual:** SUCCESS state / phone TTS
**Audio:** `human-08-success.mp3`

> "Success! The lens shows 'Paid twelve fifty to Café X, receipt emailed'. The phone panel speaks: 'Payment of rupees twelve fifty to Café X confirmed.' Every payment is verifiable on Etherscan with a receipt email via Resend."

---

## Slide 9 — Web Admin Dashboard (2:40–3:05)
**Visual:** Web panel — wallet connect, merchant picker, amount entry
**Audio:** `human-09-web-admin.mp3`

> "For merchants and power users, there's a web dashboard. Connect MetaMask — it auto-switches to Sepolia. The merchant picker shows GPS distances so you always know what's nearby. Enter the amount, see the USDC preview, sign and broadcast."

---

## Slide 10 — Admin Onboarding (3:05–3:30)
**Visual:** Admin tab — onboarding form, merchants list, payment history
**Audio:** `human-10-admin-onboard.mp3`

> "Admin tab lets you onboard new merchants: name, GPS coordinates, UPI URI, category. In production, this swaps to the payout partner's API. Payment history shows every verified transaction with Etherscan links."

---

## Slide 11 — Architecture (3:30–4:00)
**Visual:** Architecture diagram (architecture.png)
**Audio:** `human-11-architecture.mp3`

> "Under the hood: G2 lens app talks to Even Hub SDK over Bluetooth. Web panel and G2 app both call the Node backend API. Backend signs USDC transfers on Sepolia, verifies on-chain via RPC, emails receipts via Resend. No mock path — real on-chain settlement."

---

## Slide 12 — Closing (4:00–4:03)
**Visual:** Glance Pay logo / G2 glasses
**Audio:** `human-12-closing.mp3`

> "Glance Pay — hands-free stablecoin payments on G2 smart glasses. Built for the Heads Up hackathon, DeFi track. Real testnet flow, no mock payments. Glance, tap, done."

---

## Editing Notes

- **To modify narration:** Edit the text in `report/tools/human_narration.json` and re-run `report/tools/build_human_narrated.py`
- **To change voice/rate:** Modify `voice` and `rate` fields in the JSON
- **To adjust timing:** Change the `rate` value (more negative = slower)
- **Frames source:** `report/human_frames/` (extracted from `glance-pay-final-demo.mp4`)
- **Audio synthesis:** Uses edge-tts (AriaNeural, -8% rate)
- **Final output:** `report/glance-pay-human-demo.mp4` (4:03, 1920×1080)

---

## File Locations

| Asset | Path |
|-------|------|
| Narration JSON | `report/tools/human_narration.json` |
| Build script | `report/tools/build_human_narrated.py` |
| Frames | `report/human_frames/` |
| Audio segments | `report/human_narration/` |
| Video segments | `report/human_narration/segments/` |
| Final video | `report/glance-pay-human-demo.mp4` |
| Architecture diagram | `architecture.png` (and `architecture.excalidraw`) |
| This script | `demo.md` |