#!/usr/bin/env python3
"""Record a real demo video of Glance Pay using Playwright - extended version."""

import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright


async def main():
    output_path = Path(__file__).resolve().parents[2] / "report" / "glance-pay-real-demo-v2.mp4"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            record_video_dir=str(output_path.parent),
            record_video_size={"width": 1280, "height": 720},
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        
        print("🎬 Recording demo video (extended)...")
        
        # 1. Open web panel
        print("  → Opening web panel at http://127.0.0.1:8787")
        await page.goto("http://127.0.0.1:8787", wait_until="networkidle")
        await page.wait_for_selector("#connect", timeout=10000)
        await page.wait_for_timeout(3000)
        
        # 2. Show the initial state - wallet not connected
        print("  → Showing initial state (wallet not connected)")
        await page.wait_for_timeout(2000)
        
        # 3. Click connect wallet
        print("  → Clicking connect wallet button")
        await page.click("#connect")
        await page.wait_for_timeout(2000)
        
        # 4. Show merchant dropdown with GPS distances
        print("  → Opening merchant picker (shows GPS distances)")
        await page.wait_for_selector("#merchant", timeout=5000)
        await page.click("#merchant")
        await page.wait_for_timeout(1500)
        await page.keyboard.press("Escape")  # Close dropdown
        await page.wait_for_timeout(1000)
        
        # 5. Enter amount
        print("  → Entering amount: 12.50")
        await page.fill("#amount", "12.50")
        await page.wait_for_timeout(1000)
        
        # 6. Show USDC preview updates
        print("  → USDC preview updates live")
        await page.wait_for_timeout(1500)
        
        # 7. Click Pay tab to show it's active
        print("  → Pay tab active")
        await page.click("#tab-user")
        await page.wait_for_timeout(1000)
        
        # 8. Switch to Admin tab
        print("  → Switching to Admin dashboard")
        await page.click("#tab-admin")
        await page.wait_for_timeout(2000)
        
        # 9. Show admin merchant form
        print("  → Admin: merchant onboarding form")
        await page.wait_for_timeout(2000)
        
        # 10. Show admin merchants list
        print("  → Admin: registered merchants list")
        await page.wait_for_timeout(2000)
        
        # 11. Switch back to Pay tab
        print("  → Back to Pay tab")
        await page.click("#tab-user")
        await page.wait_for_timeout(1000)
        
        # 12. Show Network panel
        print("  → Network panel (verified on-chain)")
        await page.wait_for_timeout(2000)
        
        # 13. Now open G2 app
        print("  → Opening G2 lens app at http://localhost:5173")
        await page.goto("http://localhost:5173", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        # 14. Show G2 lens states
        print("  → G2 app loaded - showing IDLE lens")
        await page.wait_for_timeout(3000)
        
        # Click on the page to simulate tap (triggers LISTENING)
        print("  → Simulating tap → LISTENING state")
        await page.click("body")
        await page.wait_for_timeout(3000)
        
        # 15. Show final state
        print("  → Demo complete - holding final view")
        await page.wait_for_timeout(3000)
        
        await context.close()
        await browser.close()
        
        # Find the recorded video
        video_files = list(output_path.parent.glob("*.webm"))
        if video_files:
            latest = max(video_files, key=lambda f: f.stat().st_mtime)
            print(f"\n✅ Video recorded: {latest}")
            print(f"   Size: {latest.stat().st_size / 1024 / 1024:.2f} MB")
            return str(latest)
        else:
            print("❌ No video file found")
            return None


if __name__ == "__main__":
    result = asyncio.run(main())
    if result:
        print(f"\nWebM file: {result}")