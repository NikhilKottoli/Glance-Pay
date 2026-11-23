#!/usr/bin/env python3
"""Export Excalidraw to PNG by properly loading data into Excalidraw web app."""

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
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1200, "height": 800},
            device_scale_factor=2
        )
        page = await context.new_page()
        
        # Go to Excalidraw.com
        print("Navigating to Excalidraw.com...")
        await page.goto("https://excalidraw.com/", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        # Wait for Excalidraw to fully initialize
        print("Waiting for Excalidraw to initialize...")
        await page.wait_for_selector("canvas", timeout=15000)
        await page.wait_for_timeout(2000)
        
        # Load the diagram data via the Excalidraw API
        print("Loading diagram data via API...")
        await page.evaluate(f"""
            (data) => {{
                // Try multiple ways to load the data
                if (window.excalidrawAPI) {{
                    window.excalidrawAPI.updateScene({{ 
                        elements: data.elements, 
                        appState: data.appState, 
                        files: data.files 
                    }});
                }} else if (window.__excalidrawAPI) {{
                    window.__excalidrawAPI.updateScene({{ 
                        elements: data.elements, 
                        appState: data.appState, 
                        files: data.files 
                    }});
                }} else {{
                    // Store for later
                    window.__pendingExcalidrawData = data;
                }}
            }}
        """, data)
        
        await page.wait_for_timeout(3000)
        
        # Check if diagram rendered
        canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
        print(f"Canvas count after data load: {canvas_count}")
        
        # Try to fit to content
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