# Narrated Demo Videos — Notes

This report contains six narrated demo videos, all built with free `edge-tts`
voice narration and `ffmpeg` (static binary from `imageio-ffmpeg`).

---

## 1. Real signed payment demo (on-chain + receipt email) — `report/glance-pay-signed-payment.mp4` (NEW)

A **narrated video of a real signed on-chain payment**: 8 real UI screenshots
showing a browser wallet signature, a verified Sepolia on-chain USDC transfer and
the receipt email, with free AI voice narration. This is distinct from the e2e
walkthrough, which does not include a wallet signature.

- **Final video:** `report/glance-pay-signed-payment.mp4`
- **Format:** MP4, 1280x720, H.264 video (30 fps, yuv420p) + AAC audio (48 kHz, stereo)
- **Exact duration:** `00:02:00.56` (120.56 s)
- **File size:** 3,017,562 bytes (~2.88 MiB)

### Voice narration

- **Engine:** `edge-tts` — free Microsoft Edge neural TTS, no API key or credentials required.
- **Voice model:** `en-US-GuyNeural`
- **Rate:** `-8%`
- Per-slide text, voice and rate come from `report/tools/signing_narration.json`.
- The 8 generated MP3 files live in `report/signing_narration/` and are named per
  the `audio` field in that JSON.

### Inputs

- **Screenshots:** `screenshots/signing/` — 8 PNG files (1280x720):
  `01-home.png`, `02-admin.png`, `03-user.png`, `04-signing.png`,
  `05-signed.png`, `06-verified.png`, `07-history.png`, `08-end.png`
  (listed in `report/tools/signing_narration.json`).
- **Narration script:** `report/tools/signing_narration.json`

### Regenerate

From the repository root (`/home/azureuser/Glance-Pay`):

```bash
python3 report/tools/build_signing_video.py
```

The builder is idempotent: it reuses existing non-empty MP3s and video segments,
synthesizes only missing MP3s via edge-tts into `report/signing_narration/`, creates
one still-image + audio segment per screenshot in `report/signing_segments/` via
`-loop 1 -framerate 30` + `libx264`/`aac`, then concatenates them (stream-copy, with a
re-encode fallback) into the final MP4 with `-movflags +faststart`. It prints a final
`ffmpeg -i` verification of the output.

### Verification (from the build run)

```
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'report/glance-pay-signed-payment.mp4':
  Duration: 00:02:00.56, start: 0.000000, bitrate: 200 kb/s
  Stream #0:0: Video: h264 (High), yuv420p(progressive), 1280x720, 30 fps
  Stream #0:1: Audio: aac (LC), 48000 Hz, stereo
```

---

## 2. E2E walkthrough — `report/glance-pay-e2e-walkthrough.mp4`

A **narrated end-to-end walkthrough covering both roles** (admin and normal
user), built from the 10 real e2e UI screenshots. It shows the whole system
apart from the MetaMask wallet signature, which requires a human.

- **Final video:** `report/glance-pay-e2e-walkthrough.mp4`
- **Format:** MP4, 1280x720, H.264 video (30 fps, yuv420p) + AAC audio (48 kHz, stereo)
- **Exact duration:** `00:02:45.75` (165.75 s)
- **File size:** 4,763,884 bytes (~4.54 MiB)

### Voice narration

- **Engine:** `edge-tts` — free Microsoft Edge neural TTS, no API key or credentials required.
- **Voice model:** `en-US-GuyNeural`
- **Rate:** `-8%`
- Per-slide text, voice and rate come from `report/tools/e2e_narration.json`.
- The 10 generated MP3 files live in `report/e2e_narration/` and are named per
  the `audio` field in that JSON.

### Inputs

- **Screenshots:** `screenshots/e2e/` — 10 PNG files (1280x720):
  `01-home.png`, `02-admin-form.png`, `03-admin-added.png`,
  `04-user-merchants.png`, `05-amount.png`, `06-nowallet.png`,
  `07-faucets.png`, `08-api-reject.png`, `09-payments.png`, `10-end.png`
  (listed in `report/tools/e2e_narration.json`).
- **Narration script:** `report/tools/e2e_narration.json`

### Regenerate

From the repository root (`/home/azureuser/Glance-Pay`):

```bash
python3 report/tools/build_e2e_video.py
```

The builder is idempotent: it reuses existing non-empty MP3s and video segments,
synthesizes only missing MP3s via edge-tts into `report/e2e_narration/`, creates
one still-image + audio segment per screenshot in `report/e2e_segments/` via
`-loop 1 -framerate 30` + `libx264`/`aac`, then concatenates them (stream-copy, with a
re-encode fallback) into the final MP4 with `-movflags +faststart`. It prints a final
`ffmpeg -i` verification of the output.

### Verification (from the build run)

```
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'report/glance-pay-e2e-walkthrough.mp4':
  Duration: 00:02:45.75, start: 0.000000, bitrate: 229 kb/s
  Stream #0:0: Video: h264 (High), yuv420p(progressive), 1280x720, 30 fps
  Stream #0:1: Audio: aac (LC), 48000 Hz, stereo
```

---

## 3. Deployed web UI demo — `report/glance-pay-web-demo.mp4`

A **narrated video of the NEW deployed web UI**, chaining the 11 web UI
screenshots with free AI voice narration. It is listed after the e2e walkthrough
in the completion report deliverables.

- **Final video:** `report/glance-pay-web-demo.mp4`
- **Format:** MP4, 1280x720, H.264 video (30 fps, yuv420p) + AAC audio (48 kHz, stereo)
- **Exact duration:** `00:03:02.21` (182.21 s)
- **File size:** 5,172,721 bytes (~4.93 MiB)

### Voice narration

- **Engine:** `edge-tts` — free Microsoft Edge neural TTS, no API key or credentials required.
- **Voice model:** `en-US-GuyNeural`
- **Rate:** `-8%`
- Per-slide text, voice and rate come from `report/tools/web_narration.json`.
- The 11 generated MP3 files live in `report/web_narration/` and are named per
  the `audio` field in that JSON.

### Inputs

- **Screenshots:** `screenshots/web/` — 11 PNG files (1280x720):
  `01-problem.png`, `02-flow.png`, `03-roles.png`, `04-home.png`,
  `05-wallet.png`, `06-ready.png`, `07-paid.png`, `08-history.png`,
  `09-admin.png`, `10-onboard.png`, `11-feedback.png` (listed in
  `report/tools/web_narration.json`).
- **Narration script:** `report/tools/web_narration.json`

### Regenerate

From the repository root (`/home/azureuser/Glance-Pay`):

```bash
python3 report/tools/build_web_video.py
```

The builder is idempotent: it reuses existing non-empty MP3s and video segments,
synthesizes only missing MP3s via edge-tts into `report/web_narration/`, creates
one still-image + audio segment per screenshot in `report/web_segments/` via
`-loop 1 -framerate 30` + `libx264`/`aac`, then concatenates them (stream-copy, with a
re-encode fallback) into the final MP4 with `-movflags +faststart`. It prints a final
`ffmpeg -i` verification of the output.

### Verification (from the build run)

```
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'report/glance-pay-web-demo.mp4':
  Duration: 00:03:02.21, start: 0.000000, bitrate: 227 kb/s
  Stream #0:0: Video: h264 (High), yuv420p(progressive), 1280x720, 30 fps
  Stream #0:1: Audio: aac (LC), 48000 Hz, stereo
```

---

## 4. Slide-deck demo — `report/glance-pay-demo.mp4`

The original narrated walkthrough built from the 14 report slides.

- **Final video:** `report/glance-pay-demo.mp4`
- **Format:** MP4, 1280x720, H.264 video (30 fps) + AAC audio (48 kHz, stereo, 160 kb/s)
- **Approximate duration:** ~6 minutes 3 seconds (`00:06:03`)
- **File size:** ~11.2 MiB (11,787,829 bytes)

### Voice narration

- **Engine:** `edge-tts` — free Microsoft Edge neural TTS, no API key or credentials required.
- **Voice model:** `en-US-GuyNeural`
- **Rate:** `-8%`
- Per-slide text, voice and rate come from `report/tools/narration.json`.
- The 14 generated MP3 files live in `report/narration/` and are named per the `audio` field in that JSON.

### Inputs

- **Screenshots:** `screenshots/` — 14 PNG files (1280x720), listed in `report/tools/narration.json`.
- **Narration script:** `report/tools/narration.json`

### Regenerate

From the repository root (`/home/azureuser/Glance-Pay`):

```bash
python3 report/tools/build_video.py
```

The builder is idempotent: it reuses existing non-empty MP3s and video segments,
synthesizes only missing MP3s via edge-tts, builds one still-image + audio segment
per slide, then concatenates them (stream-copy, with a re-encode fallback) into the
final MP4. It also removes any stray `_tts_test.mp3` and prints a final `ffmpeg -i`
verification of the output.

### Verification (from the build run)

```
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'report/glance-pay-demo.mp4':
  Duration: 00:06:03.24, start: 0.000000, bitrate: 259 kb/s
  Stream #0:0: Video: h264 (High), yuv420p, 1280x720, 30 fps
  Stream #0:1: Audio: aac (LC), 48000 Hz, stereo
```

---

## 5. Actual product demo — `report/glance-pay-product-demo.mp4`

A narrated video of the **actual Glance Pay product UI**, chaining the 10 real
product screenshots with AI voice narration.

- **Final video:** `report/glance-pay-product-demo.mp4`
- **Format:** MP4, 1280x720, H.264 video (30 fps, yuv420p) + AAC audio (48 kHz, stereo, 160 kb/s)
- **Exact duration:** `00:02:34.03` (154.03 s)
- **File size:** 4,380,220 bytes (~4.18 MiB)

### Voice narration

- **Engine:** `edge-tts` — free Microsoft Edge neural TTS, no API key or credentials required.
- **Voice model:** `en-US-GuyNeural`
- **Rate:** `-8%`
- Per-slide text, voice and rate come from `report/tools/product_narration.json`.
- The 10 generated MP3 files live in `report/product_narration/` and are named per
  the `audio` field in that JSON.

### Inputs

- **Screenshots:** `screenshots/product/` — 10 PNG files (1280x720):
  `01-idle.png`, `02-listening.png`, `03-pick.png`, `04-confirm.png`,
  `05-pending.png`, `06-success.png`, `07-cancel.png`, `08-failure.png`,
  `09-nomatch.png`, `10-limit.png` (listed in `report/tools/product_narration.json`).
- **Narration script:** `report/tools/product_narration.json`

### Regenerate

From the repository root (`/home/azureuser/Glance-Pay`):

```bash
python3 report/tools/build_product_video.py
```

The builder is idempotent: it reuses existing non-empty MP3s and video segments,
synthesizes only missing MP3s via edge-tts into `report/product_narration/`, creates
one still-image + audio segment per screenshot in `report/product_segments/` via
`-loop 1 -framerate 30` + `libx264`/`aac`, then concatenates them (stream-copy, with a
re-encode fallback) into the final MP4 with `-movflags +faststart`. It prints a final
`ffmpeg -i` verification of the output.

### Verification (from the build run)

```
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'report/glance-pay-product-demo.mp4':
  Duration: 00:02:34.03, start: 0.000000, bitrate: 227 kb/s
  Stream #0:0: Video: h264 (High), yuv420p(progressive), 1280x720, 29.99 fps, 30 tbr
  Stream #0:1: Audio: aac (LC), 48000 Hz, stereo, fltp, 133 kb/s
```

---

## 6. Feedback video — `report/glance-pay-feedback-demo.mp4`

A **self-contained narrated feedback video** chaining the 14 real feedback
UI/context screenshots with free AI voice narration.

- **Final video:** `report/glance-pay-feedback-demo.mp4`
- **Format:** MP4, 1280x720, H.264 video (30 fps, yuv420p) + AAC audio (48 kHz, stereo)
- **Exact duration:** `00:04:46.22` (286.22 s)
- **File size:** 7,496,582 bytes (~7.15 MiB)

### Voice narration

- **Engine:** `edge-tts` — free Microsoft Edge neural TTS, no API key or credentials required.
- **Voice model:** `en-US-GuyNeural`
- **Rate:** `-8%`
- Per-slide text, voice and rate come from `report/tools/feedback_narration.json`.
- The 14 generated MP3 files live in `report/feedback_narration/` and are named per
  the `audio` field in that JSON.

### Inputs

- **Screenshots:** `screenshots/feedback/` — 14 PNG files (1280x720):
  `01-problem.png`, `02-flow.png`, `03-roles.png`, `04-user-wallet.png`,
  `05-admin-onboard.png`, `06-listening.png`, `07-pick.png`, `08-confirm.png`,
  `09-pending.png`, `10-success.png`, `11-history.png`, `12-cancel.png`,
  `13-refund.png`, `14-feedback.png` (listed in `report/tools/feedback_narration.json`).
- **Narration script:** `report/tools/feedback_narration.json`

### Regenerate

From the repository root (`/home/azureuser/Glance-Pay`):

```bash
python3 report/tools/build_feedback_video.py
```

The builder is idempotent: it reuses existing non-empty MP3s and video segments,
synthesizes only missing MP3s via edge-tts into `report/feedback_narration/`, creates
one still-image + audio segment per screenshot in `report/feedback_segments/` via
`-loop 1 -framerate 30` + `libx264`/`aac`, then concatenates them (stream-copy, with a
re-encode fallback) into the final MP4 with `-movflags +faststart`. It prints a final
`ffmpeg -i` verification of the output.

### Verification (from the build run)

```
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'report/glance-pay-feedback-demo.mp4':
  Duration: 00:04:46.22, start: 0.000000, bitrate: 209 kb/s
  Stream #0:0: Video: h264 (High), yuv420p(progressive), 1280x720, 30 fps
  Stream #0:1: Audio: aac (LC), 48000 Hz, stereo, fltp, 132 kb/s
```
