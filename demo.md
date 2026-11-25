# Glance Pay — Narrated Demo Script (4:03)

**Voice:** AriaNeural (ElevenLabs) | **Rate:** -8% | **Target Duration:** 4:03

---

## Slide 1: Problem Statement (0:00–0:20)

**Visual:** Café scene / person fumbling with phone

**Narration:**
"Imagine this: you're at a busy café in Bangalore. You want to pay for your coffee, but your phone is buried in your bag, your hands are full, and the UPI app takes forever to open. You just want to glance, tap, and go."

**Visual:** Phone struggle montage → Glance Pay logo reveal

**Narration:**
"That's the problem Glance Pay solves. Today, every UPI payment means: find phone → unlock → open app → scan QR → enter PIN → wait. Thirty seconds of friction for a fifty-rupee coffee. On Even Realities G2 smart glasses, we reduce that to: glance at the amount, tap your ring, done. Three seconds instead of thirty."

---

## Slide 2: The G2 Constraint (0:20–0:40)

**Visual:** G2 glasses close-up → lens display animation

**Narration:**
"The G2 puts a private monochrome display right in your eyewear — 576 by 288 pixels, green text only. No camera, no speaker. Input comes from the glasses touchpad or the R1 ring on your finger. It's built for glances, not stares."

**Visual:** Lens showing three lines: "Glance Pay / Ring or tap to pay / Say an amount"

---

## Slide 3: Payment Flow Overview (0:40–1:00)

**Visual:** Animated flow diagram: Voice → STT → Parser → GPS Sort → Ring Confirm → On-Chain → Receipt

**Narration:**
"Here's how a payment works. You tap the glasses — the lens shows 'Listening'. You say: 'Pay twelve fifty to Café X'. Raw microphone audio streams to our backend for speech-to-text, and our parser extracts the amount and merchant name."

---

## Slide 4: Voice Input & Parsing (1:00–1:20)

**Visual:** LISTENING state → Parser breakdown: "pay twelve fifty to Café X" → {amount: 12.50, merchant: "Café X"}

**Narration:**
"The parser handles natural language: decimals, words like 'twelve fifty', units like 'rupees' or 'dollars', and merchant names after 'to'. It rejects amounts over 500 rupees, negative numbers, and empty phrases — all validated in under a millisecond."

---

## Slide 5: GPS Nearby Merchants (1:20–1:40)

**Visual:** PICK_MERCHANT state showing "Café X — 50m" and "Blue Tokai — 120m" with scroll indicator

**Narration:**
"Your phone's GPS sorts nearby merchants by distance. Café X at fifty meters, Blue Tokai at one-twenty meters. Scroll the ring or temple touchpad to choose, tap to select. No auto-pay — every transaction is explicit."

---

## Slide 6: Confirm Screen (1:40–2:00)

**Visual:** CONFIRM state: "Café X / Rs 12.50 ~ 0.15 USDC / Tap to pay - ring cancel"

**Narration:**
"The confirm screen shows the merchant, rupees, and USDC equivalent on one glanceable line. One tap on the glasses or R1 ring authorizes payment. Our backend signs a real test USDC transfer on Ethereum Sepolia using a demo wallet."

---

## Slide 7: On-Chain Settlement (2:00–2:20)

**Visual:** PENDING → SUCCESS animation; Sepolia block explorer screenshot

**Narration:**
"The transaction hits Ethereum Sepolia testnet — chain ID 11155111. Our backend polls for the receipt, verifies the USDC Transfer event credits the treasury, and the amount matches. This is real on-chain settlement, not a mock."

---

## Slide 8: Success & Receipt (2:20–2:40)

**Visual:** SUCCESS state → Phone speaks "Payment confirmed" → Resend email screenshot

**Narration:**
"Success! The lens shows 'Paid twelve fifty to Café X, receipt emailed'. The phone panel speaks: 'Payment of rupees twelve fifty to Café X confirmed.' Every payment is verifiable on Etherscan with a receipt email via Resend."

---

## Slide 9: Smart Defaults (2:40–3:00)

**Visual:** IDLE state showing "Again? Rs 12.50 / Café X - tap to speak"

**Narration:**
"Smart defaults remember your last payment. Next visit to the same café: glance, tap, speak, done. No re-entry needed. The last payment is stored locally and offered on the IDLE screen."

---

## Slide 10: Web Admin Dashboard (3:00–3:20)

**Visual:** Web panel walkthrough — wallet connect → GPS merchant picker → amount entry → admin onboarding → payment history → network panel

**Narration:**
"For merchants and power users, there's a web dashboard. Connect MetaMask — it auto-switches to Sepolia. The merchant picker shows GPS distances so you always know what's nearby. Enter the amount, see the USDC preview live, sign and broadcast. Admin tab lets you onboard new merchants with name, GPS coordinates, UPI URI, and category. Payment history shows every verified transaction with Etherscan links. Network panel confirms Ethereum Sepolia, chain 11155111, verified on-chain receipts."

---

## Slide 11: Architecture & Rupee Rail (3:20–3:40)

**Visual:** Architecture diagram animation

**Narration:**
"Under the hood: G2 lens app talks to Even Hub SDK over Bluetooth. Web panel and G2 app both call the Node.js backend API. Backend signs real USDC transfers on Sepolia, verifies on-chain via RPC, emails receipts via Resend. No mock path — real on-chain settlement. In production, Rupee Rail (NikhilKottoli/RupeeRail) handles the UPI payout to merchants."

---

## Slide 11: Closing (3:40–4:03)

**Visual:** Glance Pay logo → "Glance → Tap → Done"

**Narration:**
"Glance Pay — hands-free stablecoin payments on G2 smart glasses. Built for the Heads Up hackathon, DeFi track. Real testnet flow, no mock payments. Glance, tap, done. Thank you."

---

## Technical Notes for ElevenLabs

| Parameter | Value |
|-----------|-------|
| Voice | AriaNeural |
| Rate | -8% |
| Stability | 0.75 |
| Similarity | 0.75 |
| Style | 0.2 |

**Pronunciation Guide:**
- "Sepolia" → seh-POH-lee-ah
- "UPI" → U-P-I (spelled out)
- "USDC" → U-S-D-C
- "Resend" → re-SEND
- "ElevenLabs" → E-lev-en-labs
- "Rupee Rail" → ROO-pee rail
- "NikhilKottoli" → Nik-hil Kot-to-lee

**Pacing Notes:**
- Pause 1.5s after "Glance Pay" in opening
- Pause 1s after each slide transition
- Slightly slower on technical terms (Sepolia, USDC, Rupee Rail)
- Natural conversational pace, not robotic

---

## Slide Timing Summary

| Slide | Start | End | Duration |
|-------|-------|-----|----------|
| 1. Problem | 0:00 | 0:20 | 20s |
| 2. G2 Constraint | 0:20 | 0:40 | 20s |
| 3. Payment Flow | 0:40 | 1:00 | 20s |
| 4. Voice Input | 1:00 | 1:20 | 20s |
| 5. GPS Nearby | 1:20 | 1:40 | 20s |
| 6. Confirm | 1:40 | 2:00 | 20s |
| 7. On-Chain | 2:00 | 2:20 | 20s |
| 8. Success | 2:20 | 2:40 | 20s |
| 9. Smart Defaults | 2:40 | 3:00 | 20s |
| 10. Web Admin | 3:00 | 3:20 | 20s |
| 11. Architecture | 3:20 | 3:40 | 20s |
| 12. Closing | 3:40 | 4:03 | 23s |
| **Total** | | | **4:03** |