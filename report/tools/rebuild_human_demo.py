#!/usr/bin/env python3
"""Rebuild the human narrated demo with a FRESH segments directory.

This guarantees every segment is rendered from the current frames on disk,
so stale cached segment MP4s can never leak into the final video.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_human_narrated as b  # noqa: E402

# Force a brand-new segments directory; build_segment() reads this module global.
b.SEGMENTS_DIR = b.REPORT / "human_narration" / "segments_rebuild"
b.SEGMENTS_DIR.mkdir(parents=True, exist_ok=True)

if __name__ == "__main__":
    try:
        b.main()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)
