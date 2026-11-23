#!/usr/bin/env python3
"""Record a real demo video of Glance Pay using Playwright."""

import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright


async def main():
    output_path = Path(__file__).resolve().parents[2] / "report" / "glance-pay-real-demo.mp4"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            record_video_dir=str(output_path.parent),
            record_video_size={"width": 1280, "height": 720},
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        
        print("🎬 Recording demo video...")
        
        # 1. Open web panel
        print("  → Opening web panel at http://127.0.0.1:8787")
        await page.goto("http://127.0.0.1:8787", wait_until="networkidle")
        await page.wait_for_selector("#connect", timeout=10000)
        await page.wait_for_timeout(2000)
        
        # 2. Show the initial state
        print("  → Showing initial state")
        await page.wait_for_timeout(1500)
        
        # 3. Click connect wallet (will fail without MetaMask but shows the UI)
        print("  → Clicking connect wallet")
        await page.click("#connect")
        await page.wait_for_timeout(2000)
        
        # 4. Show merchant dropdown
        print("  → Showing merchant picker with GPS distances")
        await page.wait_for_selector("#merchant", timeout=5000)
        await page.select_option("#merchant", index=0)
        await page.wait_for_timeout(1000)
        
        # 5. Enter amount
        print("  → Entering amount")
        await page.fill("#amount", "12.50")
        await page.wait_for_timeout(1000)
        
        # 6. Show USDC preview
        print("  → USDC preview updates")
        await page.wait_for_timeout(1000)
        
        # 7. Click Pay tab to show it's active
        print("  → Pay tab active")
        await page.click("#tab-user")
        await page.wait_for_timeout(1000)
        
        # 8. Switch to Admin tab
        print("  → Switching to Admin dashboard")
        await page.click("#tab-admin")
        await page.wait_for_timeout(1500)
        
        # 9. Show admin merchant form
        print("  → Admin: merchant onboarding form")
        await page.wait_for_timeout(1500)
        
        # 10. Show admin merchants list
        print("  → Admin: registered merchants list")
        await page.wait_for_timeout(1500)
        
        # 11. Switch back to Pay tab
        print("  → Back to Pay tab")
        await page.click("#tab-user")
        await page.wait_for_timeout(1000)
        
        # 12. Show Network panel
        print("  → Network panel (verified on-chain)")
        await page.wait_for_timeout(1500)
        
        # 13. Now open G2 app
        print("  → Opening G2 lens app at http://localhost:5173")
        await page.goto("http://localhost:5173", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        # 14. Show G2 lens states by interacting
        print("  → G2 app loaded - showing lens")
        await page.wait_for_timeout(2000)
        
        # Click on the page to simulate tap (triggers LISTENING)
        print("  → Simulating tap → LISTENING state")
        await page.click("body")
        await page.wait_for_timeout(2000)
        
        # 15. Show final state
        print("  → Demo complete")
        await page.wait_for_timeout(2000)
        
        await context.close()
        await browser.close()
        
        # Find the recorded video
        video_files = list(output_path.parent.glob("*.webm"))
        if video_files:
            latest = max(video_files, key=lambda f: f.stat().st_mtime)
            print(f"\n✅ Video recorded: {latest}")
            print(f"   Size: {latest.stat().st_size / 1024 / 1024:.2f} MB")
            
            # Convert to mp4
            import subprocess
            mp4_path = latest.with_suffix(".mp4")
            result = subprocess.run([
                "ffmpeg", "-y", "-i", str(latest),
                "-c:v", "libx264", "-preset", "medium", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                str(mp4_path)
            ], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Converted to MP4: {mp4_path}")
                print(f"   Size: {mp4_path.stat().st_size / 1024 / 1024:.2f} MB")
            else:
                print(f"❌ Conversion failed: {result.stderr}")
        else:
            print("❌ No video file found")


if __name__ == "__main__":
    asyncio.run(main())