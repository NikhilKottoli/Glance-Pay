# Glance Pay

Hands-free stablecoin → UPI payments on Even Realities G2 smart glasses, built on
[RupeeRail](https://github.com/NikhilKottoli/RupeeRail). Testnet only.

## Single UI — real testnet flow

```
apps/glance-pay/web/       # the only UI (HTML/CSS/JS)
apps/glance-pay/server/    # Node server: on-chain verification + receipt email
```

1. **Connect wallet** (MetaMask / EIP-1193, auto-switch to Ethereum Sepolia).
2. **Fund it** via Circle's test-USDC faucet and Base's test-ETH faucet.
3. **Sign a real USDC transfer** on Ethereum Sepolia (browser wallet).
4. Backend **verifies the transaction on-chain**, then **emails the receipt via Resend**.

There is no mock payment path. The bank/UPI settlement step is represented by the
receipt email for the hackathon; a production integration swaps that call for the
payout partner's API.

```bash
cp .env.example .env      # set RESEND_API_KEY, PAYOUT_EMAIL_TO, treasury
node apps/glance-pay/server/server.mjs
# http://127.0.0.1:8787
```

Live link (Cloudflare quick tunnel, while the session is up):
https://gifts-tumor-repeat-checklist.trycloudflare.com

`report/` holds the completion report and video artifacts from earlier iterations;
it is not part of the running app.

Author: Nikhil Kottoli <nikhilkottoli2005@gmail.com>
