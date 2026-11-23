#!/usr/bin/env python3
"""Export Excalidraw to PNG by using the Excalidraw web app export feature."""

import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    excalidraw_path = Path(__file__).resolve().parents[2] / "architecture.excalidraw"
    output_path = Path(__file__).resolve().parents[2] / "architecture.png"
    
    with open(excalidraw_path, 'r') as f:
        data = json.load(f)
    
    elements = data.get("elements", [])
    if not elements:
        print("No elements found")
        return
    
    # Calculate bounds
    min_x = min(e["x"] for e in elements)
    min_y = min(e["y"] for e in elements)
    max_x = max(e["x"] + e.get("width", 0) for e in elements)
    max_y = max(e["y"] + e.get("height", 0) for e in elements)
    
    padding = 40
    width = int(max_x - min_x + 2 * padding)
    height = int(max_y - min_y + 2 * padding)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=2
        )
        page = await context.new_page()
        
        # Go to Excalidraw.com and load the data
        print("Navigating to Excalidraw.com...")
        await page.goto("https://excalidraw.com/", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        # Load the data via the Excalidraw API
        print("Loading diagram data...")
        await page.evaluate(f"""
            (data) => {{
                if (window.excalidrawAPI) {{
                    window.excalidrawAPI.updateScene({{ 
                        elements: data.elements, 
                        appState: data.appState, 
                        files: data.files 
                    }});
                }} else {{
                    // Store for when API is ready
                    window.__excalidrawData = data;
                }}
            }}
        """, data)
        
        await page.wait_for_timeout(3000)
        
        # Try to trigger export
        print("Attempting export...")
        try:
            await page.evaluate("""
                () => {
                    if (window.excalidrawAPI) {
                        window.excalidrawAPI.exportToPNG();
                    }
                }
            """)
            await page.wait_for_timeout(2000)
        except Exception as e:
            print(f"Export API failed: {e}")
        
        # Take screenshot as fallback
        print("Taking screenshot...")
        await page.wait_for_timeout(2000)
        
        # Check for canvas
        canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
        print(f"Canvas count: {canvas_count}")
        
        await page.screenshot(path=str(output_path), full_page=True)
        await browser.close()
        
        print(f"✅ Exported to {output_path}")


if __name__ == "__main__":
    asyncio.run(main())