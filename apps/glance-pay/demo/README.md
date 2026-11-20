# Glance Pay — interactive product demo (mock mode)

A working, self-contained demo of the Glance Pay UX: a **G2 lens simulator** on the left
and the **paired phone debug/control screen** on the right. No RupeeRail backend, no
testnet wallet and no glasses hardware are required — this is the Phase 3-style mock
mode, with the later phases' safety behaviour simulated.

## Run

```bash
python3 -m http.server 8766 --bind 127.0.0.1 --directory apps/glance-pay/demo
# open http://127.0.0.1:8766/index.html
npm test --prefix apps/glance-pay/demo
```

## Roles (demo switch in the header)

- **User** — can only **connect a wallet** and **see their past payments** (stored locally).
  Merchant onboarding and payment-simulation controls are hidden and permission-gated in code.
- **Admin** — **onboards merchants** (name, address, lat/lng, UPI URI, category, aliases),
  with validation and local persistence, and drives the payment simulation for the demo.

Permissions live in `src/roles.js` (`can` / `assertCan`); every control is guarded by them.
This is a demo role switch, not real authentication.

## Try it

1. As **User**, click **Connect wallet**, then view **Your past payments** (empty until a
   payment is simulated by the admin with that wallet connected).
2. Switch to **Admin** and add a merchant through **Merchant onboarding**; it is validated
   and added to the registry used by the demo.
3. Click **Start gesture** (explicit start; no always-on wake word).
2. Enter a phrase and click **Speak (mic in)**: `pay twelve fifty`,
   `pay 200 to Blue Tokai`, `pay 50 rupees`.
3. With the default GPS position, two merchants ~15 m apart force **PICK_MERCHANT**;
   use **Ring: next candidate** and **Tap / ring confirm**.
4. Watch the lens: `CONFIRM` shows amount (INR + USDC), merchant and countdown.
5. **Tap / ring confirm** again → SIGNING → PENDING → SUCCESS.

Other paths: **Cancel gesture**, **Force timeout**, **Force payout failure (refund)**,
**Wrong merchant hint**, GPS = *Nowhere nearby*, or voice `pay 1000` for the ₹500 cap.

## What is real code here

- `src/roles.js` / `src/store.js` — role permission matrix, validated merchant onboarding,
  local-only payment history records.
- `src/state-machine.js` — all 12 states, explicit allowed transitions; illegal ones throw.
- `src/parser.js` — pure voice → `{amount, currency?, merchantHint?}`, Indian-English
  phrasing, configurable ₹500 cap.
- `src/merchants.js` — registry schema/UPI validation, haversine distance,
  accuracy-weighted ranking, fuzzy name/alias match, top-3 disambiguation.
- `data/merchants.json` — 8 seeded merchants, including a close pair (~15 m).
- `src/app.js` — lens rendering from state only, fresh-quote + re-quote logic,
  single-use confirmation (double-tap ignored), local audit log.

## Honest limitations

This is a **simulation** of the RupeeRail leg (quote/sign/submit/poll), not an
integration: there is no EIP-712 signature, no vault allowance, no UPI payout and no
real G2 SDK. Those are Phases 1–2 and 6 of the attached plan, which have not been
implemented in this repository.
