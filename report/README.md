# Glance Pay — completion report deliverables

- **Completion report (14-slide HTML deck):** `glance-pay-completion-report.html`
- **Screenshots (14 PNGs, 1280x720):** `../screenshots/` — captured from the report with the browser MCP (Playwright).
- **Product demo video (real UI):** `glance-pay-product-demo.mp4` — 10 screenshots of the interactive app driven through happy/cancel/failure paths, 1280x720, H.264 + AAC, ~2 min 34 s. App: `../apps/glance-pay/demo/`.
- **Earlier slide-deck video:** `glance-pay-demo.mp4` — 1280x720, H.264 + AAC, ~6 min 3 s.
- **Voice/narration notes and rebuild command:** `VIDEO_NOTES.md`
- **Narration script:** `tools/narration.json` · **Builder:** `tools/build_video.py`
- **Audio files:** `narration/` (14 MP3s)

The voice is `edge-tts` `en-US-GuyNeural` — a free neural TTS service requiring no API key.

To regenerate everything except the screenshots:

```bash
python3 report/tools/build_video.py
```

The report is a consolidation of the attached seven-phase plan, its decisions and acceptance criteria — not a claim that the phase checkpoints have been executed.
