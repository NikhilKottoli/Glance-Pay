# Glance Pay — deployable demo server

A dependency-free Node 22 server that serves the web app in `apps/glance-pay/web/`
and exposes a small JSON API. It is a **testnet-style prototype**: the payout is a
stub that emails a receipt through Resend; no money moves.

## Run locally

```bash
# .env at the repository root (gitignored)
# RESEND_API_KEY=re_...
# PAYOUT_EMAIL_TO=you@example.com
# PAYOUT_PROVIDER=stub-email   # or "bank"
# PORT=8787

node apps/glance-pay/server/server.mjs
# http://127.0.0.1:8787
node apps/glance-pay/server/smoke.mjs   # one real receipt email
```

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | provider name and recipient (no secrets) |
| `GET /api/merchants` | registered merchants |
| `POST /api/merchants` | admin onboarding (name, address, lat, lng, upiUri, category) |
| `POST /api/pay` | `{merchantId, amount, wallet}` → quote → stub payout → receipt |
| `GET /api/payments` | payment history with email ids and tx hashes |

## Swapping in a real bank/UPI API

`server.mjs` defines a `PayoutProvider` interface with two implementations:

- `StubEmailPayoutProvider` (default) — sends a receipt via Resend.
- `BankApiPayoutProvider` — implement `pay({merchant, amount, wallet})` against your
  bank/payout API (signed request, idempotency key, settlement webhook), then set
  `PAYOUT_PROVIDER=bank`. No other code needs to change.

## Public link

For a quick public demo, expose the server with a tunnel:

```bash
cloudflared tunnel --url http://127.0.0.1:8787
```

Cloudflare quick tunnels have no uptime guarantee and the URL changes on restart.
For a permanent link, deploy this directory to any Node host (Render, Fly, Railway,
VPS) with the same environment variables and start command above.
