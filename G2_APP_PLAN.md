# Glance Pay for Even Realities G2 — build plan (deadline sprint)

Private build. Do NOT push to the public repo until after the deadline.

## Goal
A real Even Hub app: lens text UI + ring/tap input + voice, wired to the existing
Ethereum Sepolia payment backend that verifies on-chain and emails a Resend receipt.
Demo: ≤3 min video in the official Even Hub Simulator showing a payment to a vendor.

## Decisions
- Stack: TypeScript + Vite + `@evenrealities/even_hub_sdk` (official).
- Manifest: `app.json`, edition `202601`, name "Glance Pay" (≤20 chars, no "Even").
- Permissions: `network`, `g2-microphone`, `location`.
- Display: 576×288, monochrome green; native text containers only; ≤3 lines/screen.
- Input: `bridge.onEvenHubEvent` — click=0, double=3, scroll=1/2, long=9/10.
  Handle protobuf default (click arrives with no eventType).
- Voice: `bridge.audioControl(true, AudioInputSource.Glasses)` → PCM 16kHz s16le →
  POST to backend STT; parser reuses voice→amount logic.
- Payment: backend `/api/demo-sign-and-pay` signs with the gitignored dev key,
  broadcasts a real Sepolia USDC transfer, verifies receipt, emails receipt.
  No user funds, no WebView wallet dependency.
- Packaged `.ehpk` via `@evenrealities/evenhub-cli` if CLI auth permits.

## Phases
1. Scaffold private app folder + manifest + SDK install.
2. Implement lens screen state machine and event routing.
3. Implement voice capture + STT + amount parsing.
4. Implement payment API call + status screens (paid/pending/failed).
5. Reviewer gate + focused tests.
6. Run Even Hub Simulator with automation port; capture screens; narrate ≤3 min video.
7. Send video via Telegram. Keep all new code untracked/private.
