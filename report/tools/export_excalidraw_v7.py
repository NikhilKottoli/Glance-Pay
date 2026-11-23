#!/usr/bin/env python3
"""Export Excalidraw to PNG by simulating file import in the web app."""

import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    excalidraw_path = Path(__file__).resolve().parents[2] / "architecture.excalidraw"
    output_path = Path(__file__).resolve().parents[2] / "architecture.png"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1200, "height": 800},
            device_scale_factor=2
        )
        page = await context.new_page()
        
        print("Navigating to Excalidraw.com...")
        await page.goto("https://excalidraw.com/", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        # Wait for canvas
        await page.wait_for_selector("canvas", timeout=15000)
        await page.wait_for_timeout(2000)
        
        # Use the file input to load the .excalidraw file
        print("Loading .excalidraw file via file input...")
        
        # Find the file input (usually hidden)
        file_input = await page.query_selector('input[type="file"]')
        if not file_input:
            # Try to find it via label or button
            await page.click('button:has-text("Import"), button:has-text("Open"), [aria-label*="import" i], [aria-label*="open" i]')
            await page.wait_for_timeout(1000)
            file_input = await page.query_selector('input[type="file"]')
        
        if file_input:
            print("Setting file input...")
            await file_input.set_input_files(str(Path(__file__).resolve().parents[2] / "architecture.excalidraw"))
            await page.wait_for_timeout(3000)
        else:
            print("No file input found, trying keyboard shortcut...")
            # Try Ctrl+O or similar
            await page.keyboard.press("Control+o")
            await page.wait_for_timeout(1000)
            file_input = await page.query_selector('input[type="file"]')
            if file_input:
                await file_input.set_input_files(str(Path(__file__).resolve().parents[2] / "architecture.excalidraw"))
                await page.wait_for_timeout(3000)
        
        # Check for canvas
        canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
        print(f"Canvas count after import: {canvas_count}")
        
        if canvas_count == 0:
            print("Import may have failed, trying alternative...")
            # Try drag and drop
            await page.evaluate("""
                () => {
                    const dt = new DataTransfer();
                    const file = new File([JSON.stringify(require('fs').readFileSync('/home/azureuser/Glance-Pay/architecture.excalidraw', 'utf8'))], 'architecture.excalidraw', {type: 'application/json'});
                    dt.items.add(file);
                    const event = new DragEvent('drop', {dataTransfer: dt});
                    document.dispatchEvent(event);
                }
            """)
            await page.wait_for_timeout(3000)
        
        canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
        print(f"Canvas count: {canvas_count}")
        
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