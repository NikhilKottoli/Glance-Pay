#!/usr/bin/env python3
"""Create placeholder G2 lens screenshots for testing."""
from PIL import Image, ImageDraw, ImageFont
import os

screenshots_dir = "/home/azureuser/Glance-Pay/screenshots/g2"
os.makedirs(screenshots_dir, exist_ok=True)

slides = [
    ("01-idle.png", "IDLE", "#0f0"),
    ("02-listening.png", "LISTENING", "#0f0"),
    ("03-transcript.png", "TRANSCRIPT", "#0f0"),
    ("04-pick-merchant.png", "PICK MERCHANT", "#0f0"),
    ("05-confirm.png", "CONFIRM", "#0f0"),
    ("06-pending.png", "PENDING", "#0f0"),
    ("07-success.png", "SUCCESS", "#0f0"),
]

for filename, text, color in slides:
    # G2 lens resolution: 576x288
    img = Image.new('RGB', (576, 288), '#000')
    draw = ImageDraw.Draw(img)
    
    # Try to use a monospace font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 24)
    except:
        font = ImageFont.load_default()
    
    # Draw three lines like the lens UI
    lines = [
        f"Glance Pay",
        text,
        "Tap to start" if text == "IDLE" else "Processing..."
    ]
    
    y_positions = [40, 110, 180]
    for i, (line, y) in enumerate(zip(lines, y_positions)):
        # Center text
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (576 - text_width) // 2
        draw.text((x, y), line, font=font, fill=color)
    
    # Draw container borders
    for y in [20, 90, 160]:
        draw.rectangle([10, y, 566, y + 68], outline=color, width=2)
    
    img.save(os.path.join(screenshots_dir, filename))
    print(f"Created {filename}")

print("Done creating placeholder screenshots")