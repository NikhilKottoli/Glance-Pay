#!/usr/bin/env python3
"""Record HIGH QUALITY demo of actual web panel with payment flow."""

import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright


async def main():
    output_path = Path(__file__).resolve().parents[2] / "report" / "glance-pay-hq-demo.mp4"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            record_video_dir=str(output_path.parent),
            record_video_size={"width": 1920, "height": 1080},  # Higher resolution
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2  # Higher DPI
        )
        page = await context.new_page()
        
        print("🎬 Recording HIGH QUALITY demo (1920x1080)...")
        
        # ===== 1. OPEN WEB PANEL - Full UI visible =====
        print("  → Opening web panel at http://127.0.0.1:8787")
        await page.goto("http://127.0.0.1:8787", wait_until="networkidle")
        await page.wait_for_selector("#connect", timeout=10000)
        await page.wait_for_timeout(4000)  # Show full dashboard clearly
        
        # ===== 2. CONNECT WALLET =====
        print("  → Clicking Connect Wallet")
        await page.click("#connect")
        await page.wait_for_timeout(4000)
        
        # ===== 3. MERCHANT PICKER WITH GPS DISTANCES - CLEARLY VISIBLE =====
        print("  → Opening merchant dropdown (GPS distances)")
        await page.wait_for_selector("#merchant", timeout=5000)
        await page.click("#merchant")
        await page.wait_for_timeout(4000)  # Show dropdown clearly
        await page.keyboard.press("ArrowDown")
        await page.wait_for_timeout(1500)
        await page.keyboard.press("ArrowDown")
        await page.wait_for_timeout(1500)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(1500)
        
        # ===== 4. ENTER AMOUNT - USDC PREVIEW UPDATES =====
        print("  → Entering amount 12.50 → USDC preview")
        await page.fill("#amount", "12.50")
        await page.wait_for_timeout(3000)
        
        # ===== 5. CLICK PAY BUTTON - SHOW IT'S ENABLED =====
        print("  → Pay button enabled - ready to sign")
        await page.click("#tab-user")
        await page.wait_for_timeout(2000)
        # Hover over pay button to show it's clickable
        await page.hover("#pay")
        await page.wait_for_timeout(2000)
        
        # ===== 6. ADMIN DASHBOARD - ONBOARD MERCHANT FORM =====
        print("  → Admin tab - merchant onboarding form")
        await page.click("#tab-admin")
        await page.wait_for_timeout(3000)
        await page.wait_for_selector("#m-name", timeout=5000)
        # Fill form to show it works
        await page.fill("#m-name", "Demo Cafe")
        await page.wait_for_timeout(500)
        await page.fill("#m-address", "Demo Street, Bengaluru")
        await page.wait_for_timeout(500)
        await page.fill("#m-lat", "12.9716")
        await page.wait_for_timeout(500)
        await page.fill("#m-lng", "77.5946")
        await page.wait_for_timeout(500)
        await page.fill("#m-upi", "upi://pay?pa=demo@upi&pn=Demo%20Cafe&cu=INR")
        await page.wait_for_timeout(500)
        await page.wait_for_timeout(2000)
        
        # ===== 7. ADMIN MERCHANTS LIST =====
        print("  → Admin merchants list")
        await page.wait_for_timeout(3000)
        
        # ===== 8. BACK TO PAY + NETWORK PANEL =====
        print("  → Back to Pay → Network panel (verified on-chain)")
        await page.click("#tab-user")
        await page.wait_for_timeout(2000)
        await page.wait_for_timeout(3000)
        
        # ===== 9. G2 LENS APP =====
        print("  → G2 Lens App at http://localhost:5173")
        await page.goto("http://localhost:5173", wait_until="networkidle")
        await page.wait_for_timeout(5000)
        
        # G2 IDLE
        print("    → G2 IDLE state")
        await page.wait_for_timeout(4000)
        
        # Tap → LISTENING
        print("    → Tap → LISTENING")
        await page.click("body")
        await page.wait_for_timeout(5000)
        
        # ===== 10. BACK TO WEB PANEL - SHOW PAYMENT HISTORY =====
        print("  → Back to web panel - payment history in admin")
        await page.goto("http://127.0.0.1:8787", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        await page.click("#tab-admin")
        await page.wait_for_timeout(4000)
        
        # ===== FINAL HOLD =====
        print("  → Final view")
        await page.wait_for_timeout(4000)
        
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