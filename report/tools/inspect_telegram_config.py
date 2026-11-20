#!/usr/bin/env python3
"""Print Telegram-related MCP config with all secret values masked."""
import json
from pathlib import Path

PATHS = [
    Path("/root/.config/opencode/opencode.json"),
    Path("/root/.config/opencode/service.json"),
    Path("/home/azureuser/.config/opencode/opencode.json"),
]


def mask(v):
    s = str(v)
    if len(s) <= 8:
        return "***"
    return s[:4] + "..." + s[-4:] + f" (len={len(s)})"


def walk(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{path}.{k}" if path else k
            if "telegram" in k.lower() or "telegram" in str(v).lower() if isinstance(v, str) else "telegram" in k.lower():
                if isinstance(v, (str, int, float, bool)):
                    sensitive = any(x in k.upper() for x in ("TOKEN", "SECRET", "KEY", "URL"))
                    print(f"{p} = {mask(v) if sensitive else v}")
                elif isinstance(v, (dict, list)):
                    print(f"{p}: (container)")
            walk(v, p)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            walk(v, f"{path}[{i}]")


for p in PATHS:
    if not p.exists():
        continue
    print(f"=== {p} ===")
    try:
        walk(json.loads(p.read_text()))
    except Exception as e:
        print("parse error:", type(e).__name__)
