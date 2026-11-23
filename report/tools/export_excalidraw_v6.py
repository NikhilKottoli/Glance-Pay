#!/usr/bin/env python3
"""Export Excalidraw to PNG using URL-based scene loading."""

import asyncio
import json
import base64
import zlib
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    excalidraw_path = Path(__file__).resolve().parents[2] / "architecture.excalidraw"
    output_path = Path(__file__).resolve().parents[2] / "architecture.png"
    
    with open(excalidraw_path, 'r') as f:
        data = json.load(f)
    
    # Excalidraw uses a specific format for URL sharing:
    # Compress the JSON with zlib, then base64 encode
    json_str = json.dumps(data, separators=(',', ':'))
    compressed = zlib.compress(json_str.encode('utf-8'))
    encoded = base64.urlsafe_b64encode(compressed).decode('ascii')
    
    # Excalidraw URL format: https://excalidraw.com/#json=<encoded>
    url = f"https://excalidraw.com/#json={encoded}"
    print(f"URL length: {len(url)} chars")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1200, "height": 800},
            device_scale_factor=2
        )
        page = await context.new_page()
        
        print("Navigating to Excalidraw with scene data in URL...")
        await page.goto(url, wait_until="networkidle")
        await page.wait_for_timeout(5000)
        
        # Check for canvas
        canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
        print(f"Canvas count: {canvas_count}")
        
        # Wait for render
        await page.wait_for_timeout(3000)
        
        # Zoom to fit
        try:
            await page.evaluate("""
                () => {
                    if (window.excalidrawAPI) {
                        window.excalidrawAPI.zoomToFit();
                    }
                }
            """)
            await page.wait_for_timeout(1000)
        except:
            pass
        
        # Take screenshot
        print("Taking screenshot...")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="/home/azureuser/Glance-Pay/architecture.png", full_page=True)
        
        canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
        print(f"Final canvas count: {canvas_count}")
        
        await browser.close()
        print("✅ Exported")


if __name__ == "__main__":
    asyncio.run(main())