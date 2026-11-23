#!/usr/bin/env python3
"""Export Excalidraw to PNG using proper initialization."""

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
        
        # Create HTML with Excalidraw - proper initialization
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.17.4/dist/excalidraw.production.min.js"></script>
    <style>
        body {{ margin: 0; padding: 0; background: white; overflow: hidden; }}
        #app {{ width: {width}px; height: {height}px; }}
    </style>
</head>
<body>
    <div id="app"></div>
    <script>
        const elements = {json.dumps(elements)};
        const appState = {json.dumps(data.get("appState", {}))};
        const files = {json.dumps(data.get("files", {}))};
        
        const container = document.getElementById('app');
        
        // Wait for library to load, then initialize
        function init() {{
            if (window.ExcalidrawLib) {{
                const container = document.getElementById('app');
                ExcalidrawLib.Excalidraw({{
                    initialData: {{
                        elements: elements,
                        appState: {{...appState, viewBackgroundColor: "#ffffff"}},
                        files: files
                    }},
                    viewModeEnabled: true,
                    theme: 'light',
                    container: container,
                    onChange: () => {{}}
                }});
            }} else {{
                setTimeout(init, 100);
            }}
        }}
        init();
    </script>
</body>
</html>
"""
        
        await page.set_content(html_content, wait_until="networkidle")
        # Wait for Excalidraw to render
        for i in range(30):
            await page.wait_for_timeout(1000)
            canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
            if canvas_count > 0:
                print(f"Canvas found at attempt {i+1}")
                break
        
        canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
        print(f"Final canvas count: {canvas_count}")
        
        # Take screenshot
        await page.screenshot(path=str(output_path), full_page=True)
        await browser.close()
        
        print(f"✅ Exported to {output_path} ({width}x{height})")


if __name__ == "__main__":
    asyncio.run(main())