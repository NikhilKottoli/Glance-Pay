# Glance Pay

Hands-free stablecoin → UPI payments on Even Realities G2 smart glasses, built on
[RupeeRail](https://github.com/NikhilKottoli/RupeeRail). Testnet only.

## What is here

- `apps/glance-pay/demo/` — interactive mock-mode product demo (G2 lens simulator +
  paired phone). Two roles: **user** (connect wallet, view past payments) and
  **admin** (onboard merchants, drive the simulated payment flow). See its README.
- `report/` — completion report, narrated videos, builders and Telegram sender.
- `screenshots/` — browser-MCP captures of the report and the product demo.

## Run the demo

```bash
python3 -m http.server 8766 --bind 127.0.0.1 --directory apps/glance-pay/demo
# open http://127.0.0.1:8766/index.html
npm test --prefix apps/glance-pay/demo
```

The attached 7-phase plan (environment, RupeeRail trace, lens UX, voice, merchant
resolution, real payments, demo hardening) is specified in the project brief; the
checkpoint implementation phases beyond the mock demo have not been executed yet.

Author: Nikhil Kottoli <nikhilkottoli2005@gmail.com>
