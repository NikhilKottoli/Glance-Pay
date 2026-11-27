# Deploying Glance Pay on Render

The repo ships a Render Blueprint (`render.yaml`) that creates two free services:

| Service | Type | What it serves |
|---|---|---|
| `glance-pay-api` | Node web service | REST API **and** the static web panel (`apps/glance-pay/web`) |
| `glance-pay-g2` | Static site | Built Even Hub G2 lens app (`apps/glance-pay-g2/dist`) |

The web panel talks to the API with relative paths (`/api/...`), so one Node service covers both. The G2 lens app is a separate Vite bundle and needs the API's public URL baked in at build time (`VITE_API_BASE`).

---

## 1. Push the repo

`render.yaml` must be at the repository root, and Render reads it from your default branch.

```bash
git add render.yaml docs/RENDER_DEPLOY.md
git commit -m "chore(deploy): add Render blueprint and deployment notes"
git push origin main
```

---

## 2. Create the Blueprint

1. Open <https://dashboard.render.com/blueprints>.
2. **New Blueprint Instance** → pick `NikhilKottoli/Glance-Pay` → branch `main`.
3. Render parses `render.yaml` and asks for the `sync: false` values (see the table below).
4. **Apply**.

First deploy takes a few minutes. The API is live at:

```
https://glance-pay-api.onrender.com/api/health
```

Expected response:

```json
{ "ok": true, "mode": "real-onchain-testnet", "chain": "Ethereum Sepolia", "chainId": 11155111, ... }
```

If the service fails to boot with `PAYOUT_TREASURY_ADDRESS is required in .env`, that env var is missing — set it and redeploy.

---

## 3. Point the G2 app at the API

After the API service exists, copy its URL and set it on the static site:

Render Dashboard → **glance-pay-g2** → **Environment** → `VITE_API_BASE` = `https://glance-pay-api.onrender.com` → **Save** → **Manual Deploy**.

Vite inlines the value at build time, so it must be set **before** the build runs. Redeploying after a change is required.

---

## 4. Environment variables

Copy `.env.example` to `.env` for local development. On Render, **never commit `.env`** — add the same keys under **Environment** in the dashboard.

| Key | Required | Used by | Notes |
|---|---|---|---|
| `PAYOUT_TREASURY_ADDRESS` | **yes** | server | Sepolia address that receives USDC. Server throws at boot if missing. |
| `RESEND_API_KEY` | **yes** (for receipts) | server | Resend key (`re_...`). Without it `/api/pay` and `/api/demo-sign-and-pay` return `RESEND_API_KEY is not configured`. |
| `PAYOUT_EMAIL_TO` | recommended | server | Receipt recipient. Defaults to the author's email if unset — set it explicitly. |
| `DEMO_WALLET_PRIVATE_KEY` | for server-signing | server | 64 hex chars, **no `0x` prefix**. Enables `POST /api/demo-sign-and-pay`. Use a throwaway Sepolia-only wallet. |
| `PORT` | no | server | Render sets this automatically. Local default `8787`. Do **not** hard-code it on Render. |
| `VITE_API_BASE` | G2 build only | `apps/glance-pay-g2` | Public API URL. Defaults to `http://127.0.0.1:8787` if unset. |

There is no database and no ORM: merchants and payment history live in
`apps/glance-pay/server/data/*.json`, created and seeded on first boot.

---

## 5. Manual setup (without the Blueprint)

If you prefer clicking through the dashboard, create the same two services by hand.

**API — Web Service**

- Runtime: **Node**
- Root Directory: `apps/glance-pay`
- Build Command: `npm install --omit=dev`
- Start Command: `node server/server.mjs`
- Health Check Path: `/api/health`
- Env vars: the table above.

**G2 — Static Site**

- Root Directory: `apps/glance-pay-g2`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Env var: `VITE_API_BASE=https://<your-api>.onrender.com`
- Rewrite: `/*` → `/index.html`

---

## Caveats on the free plan

- **Cold starts.** Free web services sleep after ~15 minutes of inactivity; the first request afterwards takes ~30–60 s. Hit `/api/health` before a demo.
- **Ephemeral disk.** Files written under `apps/glance-pay/server/data/` are lost on every deploy or restart. The three demo merchants are re-seeded automatically, but onboarded merchants and payment history are not. Add a Render persistent disk (paid) or external storage if you need them to survive.
- **No `0x` on the private key.** `DEMO_WALLET_PRIVATE_KEY` is validated as exactly 64 hex characters; a `0x` prefix makes the endpoint return `DEMO_WALLET_PRIVATE_KEY not configured`.
- **Testnet only.** The chain is hard-coded to Ethereum Sepolia (`11155111`) with Circle's Sepolia USDC contract. No mainnet path exists in this build.
