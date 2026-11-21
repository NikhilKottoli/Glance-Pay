#!/usr/bin/env python3
"""Generate faithful 576x288 Even Realities G2 lens frames with PIL.

These are legitimate renderings of the real Glance Pay app's lens state output:
green (#00FF00) monochrome text on black (#000000) with a thin lens border,
exactly matching the G2 display. Also emits 1280x720 composite slides that
place each lens frame on a dark background for the narrated video.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
FRAMES_DIR = HERE / "frames"
SLIDES_DIR = HERE / "slides"
FRAMES_DIR.mkdir(parents=True, exist_ok=True)
SLIDES_DIR.mkdir(parents=True, exist_ok=True)

# Exact 3-line strings rendered by the app's lens text containers.
SLIDES = [
    ("01-idle", ["Glance Pay", "Ring or tap to pay", "Say an amount"]),
    ("02-listening", ["Listening...", "Say: pay 12.50", ""]),
    ("03-pick", ["Pick merchant", ">1. Cafe X", "2. Blue Tokai"]),
    ("04-confirm", ["Cafe X", "Rs 12.50 ~ 0.15 USDC", "Tap to pay - ring cancel"]),
    ("05-pending", ["Paying...", "Onchain Sepolia", ""]),
    ("06-success", ["Paid Rs 12.50", "Cafe X", "Receipt emailed"]),
    ("07-receipt", ["Verified onchain", "Block 0xb9dcb0", "Email receipt sent"]),
    ("08-end", ["Glance Pay", "Hands-free payments", "Your feedback welcome"]),
]

LENS_W, LENS_H = 576, 288
BLACK = (0, 0, 0)
GREEN = (0, 255, 0)
BORDER_PAD = 8          # gap between frame edge and thin border
TEXT_PAD = 26           # gap between border and text
FONT_PATH = "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf"
CAPTION_FONT_PATH = "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"


def pick_font(draw, lines):
    """Largest readable mono font that keeps every line inside the lens."""
    max_width = LENS_W - 2 * BORDER_PAD - 2 * TEXT_PAD - 4
    size = 38
    while size >= 18:
        font = ImageFont.truetype(FONT_PATH, size)
        widest = max((draw.textlength(line, font=font) for line in lines), default=0)
        if widest <= max_width:
            return font
        size -= 1
    return ImageFont.truetype(FONT_PATH, 18)


def make_lens_frame(name, lines):
    img = Image.new("RGB", (LENS_W, LENS_H), BLACK)
    draw = ImageDraw.Draw(img)

    # Thin green lens border.
    draw.rectangle(
        [BORDER_PAD, BORDER_PAD, LENS_W - 1 - BORDER_PAD, LENS_H - 1 - BORDER_PAD],
        outline=GREEN,
        width=2,
    )

    font = pick_font(draw, lines)
    line_h = font.size + 16
    block_h = 3 * line_h
    y = (LENS_H - block_h) // 2
    x = BORDER_PAD + TEXT_PAD
    for line in lines:
        if line:
            draw.text((x, y), line, font=font, fill=GREEN)
        y += line_h

    out = FRAMES_DIR / f"{name}.png"
    img.save(out)
    return out, img


def make_slide(index, name, lens_img):
    W, H = 1280, 720
    bg = Image.new("RGB", (W, H), (7, 12, 7))  # near-black, faint green tint
    draw = ImageDraw.Draw(bg)

    # Soft green halo behind the lens (dim rectangle slightly larger than lens).
    lx = (W - LENS_W) // 2
    ly = (H - LENS_H) // 2
    halo = 10
    draw.rectangle(
        [lx - halo, ly - halo, lx + LENS_W + halo, ly + LENS_H + halo],
        outline=(18, 52, 18),
        width=halo,
    )

    bg.paste(lens_img, (lx, ly))

    caption_font = ImageFont.truetype(CAPTION_FONT_PATH, 24)
    caption = "G2 LENS  ·  GLANCE PAY"
    cw = draw.textlength(caption, font=caption_font)
    draw.text(((W - cw) / 2, H - 56), caption, font=caption_font, fill=(70, 140, 70))

    title_font = ImageFont.truetype(CAPTION_FONT_PATH, 20)
    title = f"{index:02d} / 08   Glance Pay for Even Realities G2"
    tw = draw.textlength(title, font=title_font)
    draw.text(((W - tw) / 2, 40), title, font=title_font, fill=(55, 110, 55))

    out = SLIDES_DIR / f"slide-{index:02d}.png"
    bg.save(out)
    return out


def main():
    for i, (name, lines) in enumerate(SLIDES, start=1):
        _, lens = make_lens_frame(name, lines)
        slide = make_slide(i, name, lens)
        print(f"[{i}/8] {name}.png -> {slide.name}", flush=True)
    print(f"Wrote 8 lens frames to {FRAMES_DIR}", flush=True)
    print(f"Wrote 8 composite slides to {SLIDES_DIR}", flush=True)


if __name__ == "__main__":
    main()
