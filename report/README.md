# Glance Pay — completion report deliverables

- **e2e walkthrough (both roles, no wallet signature; NEW):** `glance-pay-e2e-walkthrough.mp4` — 10 real UI screenshots (admin + normal user flows) from `../screenshots/e2e/` chained with free AI voice narration; covers the full flow except the MetaMask wallet signature; 1280x720, H.264 + AAC, ~2 min 46 s. Script: `tools/e2e_narration.json` · Builder: `tools/build_e2e_video.py` · Audio: `e2e_narration/` (10 MP3s).
- **Deployed web UI demo (self-contained, narrated):** `glance-pay-web-demo.mp4` — 11 screenshots of the NEW deployed web UI from `../screenshots/web/` chained with free AI voice narration; 1280x720, H.264 + AAC, ~3 min 2 s. Script: `tools/web_narration.json` · Builder: `tools/build_web_video.py` · Audio: `web_narration/` (11 MP3s).
- **Feedback video (self-contained, narrated):** `glance-pay-feedback-demo.mp4` — 14 real UI/context screenshots from `../screenshots/feedback/` chained with free AI voice narration; 1280x720, H.264 + AAC, ~4 min 46 s. Script: `tools/feedback_narration.json` · Builder: `tools/build_feedback_video.py` · Audio: `feedback_narration/` (14 MP3s).
- **Completion report (14-slide HTML deck):** `glance-pay-completion-report.html`
- **Screenshots (14 PNGs, 1280x720):** `../screenshots/` — captured from the report with the browser MCP (Playwright).
- **Product demo video (real UI):** `glance-pay-product-demo.mp4` — 10 screenshots of the interactive app driven through happy/cancel/failure paths, 1280x720, H.264 + AAC, ~2 min 34 s. App: `../apps/glance-pay/demo/`.
- **Earlier slide-deck video:** `glance-pay-demo.mp4` — 1280x720, H.264 + AAC, ~6 min 3 s.
- **Voice/narration notes and rebuild command:** `VIDEO_NOTES.md`
- **Narration script:** `tools/narration.json` · **Builder:** `tools/build_video.py`
- **Audio files:** `narration/` (14 MP3s)

The voice is `edge-tts` `en-US-GuyNeural` — a free neural TTS service requiring no API key.

To regenerate the e2e walkthrough (except the screenshots):

```bash
python3 report/tools/build_e2e_video.py
```

To regenerate the deployed web UI demo (except the screenshots):

```bash
python3 report/tools/build_web_video.py
```

To regenerate the earlier videos:

```bash
python3 report/tools/build_feedback_video.py
python3 report/tools/build_product_video.py
python3 report/tools/build_video.py
```

The report is a consolidation of the attached seven-phase plan, its decisions and acceptance criteria — not a claim that the phase checkpoints have been executed.
