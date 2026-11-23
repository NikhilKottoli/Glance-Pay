#!/usr/bin/env python3
"""Export Excalidraw to PNG using Playwright."""

import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    excalidraw_path = Path(__file__).resolve().parents[2] / "architecture.excalidraw"
    output_path = Path(__file__).resolve().parents[2] / "architecture.png"
    
    # Read the Excalidraw file
    with open(excalidraw_path, 'r') as f:
        data = json.load(f)
    
    # Find bounds of all elements
    elements = data.get("elements", [])
    if not elements:
        print("No elements found")
        return
    
    min_x = min(e["x"] for e in elements)
    min_y = min(e["y"] for e in elements)
    max_x = max(e["x"] + e.get("width", 0) for e in elements)
    max_y = max(e["y"] + e.get("height", 0) for e in elements)
    
    # Add padding
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
        
        # Create HTML with Excalidraw embedded
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.17.4/dist/excalidraw.production.min.js"></script>
    <style>
        body {{ margin: 0; padding: 0; background: white; }}
        #app {{ width: 100%; height: 100%; }}
    </style>
</head>
<body>
    <div id="app"></div>
    <script>
        const elements = {json.dumps(elements)};
        const appState = {json.dumps(data.get("appState", {}))};
        const files = {json.dumps(data.get("files", {}))};
        
        const container = document.getElementById('app');
        ExcalidrawLib.Excalidraw({{
            initialData: {{
                elements: elements,
                appState: appState,
                files: files
            }},
            viewModeEnabled: true,
            theme: 'light',
            container: container,
            onChange: () => {{}}
        }});
    </script>
</body>
</html>
"""
        
        await page.set_content(html_content)
        await page.wait_for_timeout(3000)  # Wait for render
        
        # Take screenshot
        await page.screenshot(path=str(output_path), full_page=True)
        await browser.close()
        
        print(f"✅ Exported to {output_path} ({width}x{height})")


if __name__ == "__main__":
    asyncio.run(main())