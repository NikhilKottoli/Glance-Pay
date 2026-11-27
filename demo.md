# Glance Pay — Narrated Demo Script (~4:00)

**Voice:** en-US-AriaNeural (edge-tts dry run) · ElevenLabs voice (final)
**Rate:** -8%
**Runtime:** 3:59
**Visual source:** `architecture.png` (rendered from `architecture.excalidraw`)

> The final slide is the architecture overview. It intentionally has no
> hackathon/track narration — it walks the diagram and explains Rupee Rail
> as the production payout edge.

---

## Slide 1 — The Moment (0:00–0:18)

**Visual:** Café scene; person fumbling with phone.

**Narration:**
"Imagine this: you're at a busy café in Bangalore. You want to pay for your coffee, but your phone is buried in your bag, your hands are full, and the UPI app takes forever to open. You just want to glance, tap, and go."

---

## Slide 2 — The Friction (0:18–0:40)

**Visual:** Phone struggle montage → Glance Pay logo reveal.

**Narration:**
"That's the problem Glance Pay solves. Today, every payment means: find phone, unlock, open app, scan QR, enter PIN, wait. On Even Realities G2 smart glasses, we reduce that to: glance at the amount, tap your ring, done. Three seconds instead of thirty."

---

## Slide 3 — The G2 Constraint (0:40–1:04)

**Visual:** G2 glasses close-up → lens display animation.

**Narration:**
"The G2 puts a private monochrome display right in your eyewear — 576 by 288 pixels, green text only. No camera, no speaker. Input comes from the glasses touchpad or the R1 ring on your finger. It's built for glances, not stares."

---

## Slide 4 — Payment Flow (1:04–1:25)

**Visual:** LISTENING state → parser breakdown: "pay twelve fifty to Café X" → {amount: 12.50, merchant: "Café X"}.

**Narration:**
"Here's how a payment works. You tap the glasses — the lens shows 'Listening'. You say: 'Pay twelve fifty to Café X'. Raw microphone audio streams to our backend, speech-to-text converts it, and our parser extracts the amount and merchant name."

---

## Slide 5 — GPS Nearby Merchants (1:25–1:45)

**Visual:** PICK_MERCHANT state showing "Café X — 50m" and "Blue Tokai — 120m".

**Narration:**
"The lens now shows nearby merchants sorted by GPS distance — Café X at fifty meters, Blue Tokai at one-twenty meters. You scroll with the ring or temple touchpad, tap to select. No auto-pay; every transaction is explicit."

---

## Slide 6 — Confirm (1:45–2:03)

**Visual:** CONFIRM state: "Café X / Rs 12.50 ~ 0.15 USDC / Tap to pay".

**Narration:**
"The confirm screen shows the merchant, rupees, and USDC equivalent on one glanceable line. One tap on the glasses or R1 ring authorizes payment. Our backend signs a real test USDC transfer on Ethereum Sepolia using a demo wallet."

---

## Slide 7 — On-Chain Settlement (2:03–2:26)

**Visual:** PENDING → SUCCESS animation; Sepolia block explorer.

**Narration:**
"The transaction hits Ethereum Sepolia testnet — chain ID 11155111. Our backend polls for the receipt, verifies the USDC Transfer event credits the treasury, and checks the amount matches. This is real on-chain settlement, not a mock."

---

## Slide 8 — Success & Receipt (2:26–2:46)

**Visual:** SUCCESS state → phone speaks "Payment confirmed" → Resend email.

**Narration:**
"Success! The lens shows 'Paid twelve fifty to Café X, receipt emailed'. The phone panel speaks: 'Payment of rupees twelve fifty to Café X confirmed.' Every payment is verifiable on Etherscan, with a receipt email via Resend."

---

## Slide 9 — Web Dashboard (2:46–3:07)

**Visual:** Web panel — MetaMask connect → GPS merchant picker → amount entry → USDC preview → sign & broadcast.

**Narration:**
"For merchants and power users, there's a web dashboard. Connect MetaMask — it auto-switches to Sepolia. The merchant picker shows GPS distances so you always know what's nearby. Enter the amount, see the USDC preview live, then sign and broadcast."

---

## Slide 10 — Admin Onboarding (3:07–3:26)

**Visual:** Admin tab — merchant form (name, GPS, UPI URI, category) → payment history → network panel.

**Narration:**
"The admin tab lets you onboard new merchants: name, GPS coordinates, UPI URI, and category. In production, this swaps to the payout partner's API. Payment history shows every verified transaction with Etherscan links, and the network panel confirms Ethereum Sepolia, chain 11155111."

---

## Slide 11 — Architecture & Rupee Rail (3:26–4:00) — FINAL

**Visual:** `architecture.png` (Excalidraw): G2 Lens App → Node.js Backend → Ethereum Sepolia / Resend; Web Panel (Phone) → Backend. Rupee Rail is the production payout edge.

**Narration:**
"Here's the architecture. The G2 lens app handles voice, parsing, GPS, and ring confirmation. It calls a Node.js backend, and so does the phone's web panel. The backend signs the USDC transfer, verifies it on Ethereum Sepolia, and emails the receipt through Resend. In production, Rupee Rail converts that settlement into a direct UPI payout, so users never touch crypto. Glance, tap, done."

---

## Technical Notes for ElevenLabs

| Parameter | Value |
|-----------|-------|
| Voice (dry run) | en-US-AriaNeural |
| Voice (final) | ElevenLabs (Aria or chosen voice) |
| Rate | -8% |
| Stability | 0.75 |
| Similarity | 0.75 |
| Style | 0.2 |

**Pronunciation Guide:**
- "G2" → G-two
- "R1" → R-one
- "Sepolia" → seh-POH-lee-ah
- "UPI" → U-P-I (spelled out)
- "USDC" → U-S-D-C
- "MetaMask" → Meta-Mask
- "Resend" → re-SEND
- "Rupee Rail" → ROO-pee rail
- "NikhilKottoli" → Nik-hil Kot-to-lee

**Pacing Notes:**
- Pause 1.5s after "Glance Pay" in the opening.
- Pause 1s after each slide transition.
- Slow slightly on technical terms (Sepolia, USDC, Rupee Rail).
- Conversational pace, not robotic.

---

## Slide Timing Summary

| Slide | Start | End | Duration |
|-------|-------|-----|----------|
| 1. The Moment | 0:00 | 0:18 | 18s |
| 2. The Friction | 0:18 | 0:40 | 22s |
| 3. G2 Constraint | 0:40 | 1:04 | 23s |
| 4. Payment Flow | 1:04 | 1:25 | 21s |
| 5. GPS Nearby | 1:25 | 1:45 | 20s |
| 6. Confirm | 1:45 | 2:03 | 19s |
| 7. On-Chain | 2:03 | 2:26 | 22s |
| 8. Success | 2:26 | 2:46 | 21s |
| 9. Web Dashboard | 2:46 | 3:07 | 21s |
| 10. Admin Onboarding | 3:07 | 3:26 | 19s |
| 11. Architecture & Rupee Rail | 3:26 | 4:00 | 33s |
| **Total** | | | **3:59** |

---

## Feature Notes (implemented, not separate slides)

- Smart repeat-payment defaults: last payment offered on the IDLE screen.
- Escalation: 30s confirm timeout → 1 retry → cancel.
- Ring source detection: R1 vs temple touchpad.
- Phone-side TTS confirmation.
- Parser validation: rejects amounts over 500 INR, negatives, empty phrases.

---

## Duration Note

This cut is 3:59. The hackathon demo cap is ≤3:00.
Submission options:
1. Use the existing `report/glance-pay-final-narrated.mp4` (2:24).
2. Render a 3:00 cut by dropping Slide 3 and Slide 10.
