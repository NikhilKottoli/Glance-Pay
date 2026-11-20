# Glance Pay server — one real testnet flow

The only UI is `apps/glance-pay/web/`, served by this dependency-free Node 22 server.

## What actually happens

1. The browser connects an EIP-1193 wallet (MetaMask) and switches/adds **Base Sepolia** (chain 84532).
2. The user funds that address with **test USDC** (Circle faucet) and **test ETH** for gas.
3. The user signs a real ERC-20 `transfer` of USDC to the treasury address configured in `.env`.
4. The backend calls `eth_getTransactionReceipt` on `https://sepolia.base.org`, checks
   status, USDC contract, Transfer log, recipient and amount, then **emails the receipt via Resend**.

There is no mock payment path. The bank/UPI settlement step is represented by the
receipt email in this hackathon build; replacing `sendReceiptEmail()` with the payout
partner's API is the production follow-up.

## Run

```bash
cp .env.example .env   # then fill in RESEND_API_KEY and PAYOUT_EMAIL_TO
node apps/glance-pay/server/server.mjs
# http://127.0.0.1:8787
```

Env vars: `RESEND_API_KEY`, `PAYOUT_EMAIL_TO`, `PAYOUT_TREASURY_ADDRESS`, `PORT`.

Verified constants (Circle docs): Base Sepolia USDC
`0x036CbD53842c5426634e7929541eC2318f3dCF7e`, 6 decimals, chain ID 84532.
Faucets: https://faucet.circle.com/ (20 test USDC / 2 h) and
https://docs.base.org/get-started/get-funds (test ETH).

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | status, chain, recipient (no secrets) |
| `GET /api/chain` | chainId, RPC, USDC contract, treasury, explorer |
| `GET /api/merchants` / `POST /api/merchants` | admin merchant registry |
| `POST /api/pay` | `{merchantId, amount, wallet, txHash}` → verify on-chain → email |
| `GET /api/payments` | verified payments with tx hashes and email IDs |

## Public link

`cloudflared tunnel --url http://127.0.0.1:8787` gives a temporary public URL.
For a permanent deployment, host this server on any Node platform with the same env vars.
