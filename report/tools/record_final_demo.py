#!/usr/bin/env python3
"""Record final demo: G2 lens app payment flow + web app admin dashboard."""

import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright


async def main():
    output_path = Path(__file__).resolve().parents[2] / "report" / "glance-pay-final-demo.mp4"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            record_video_dir=str(output_path.parent),
            record_video_size={"width": 1920, "height": 1080},
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2
        )
        page = await context.new_page()
        
        print("🎬 Recording FINAL demo: G2 lens app + Web admin dashboard")
        
        # ============================================================
        # PART 1: G2 LENS APP - Payment Flow (the "paying" demo)
        # ============================================================
        print("  → PART 1: G2 Lens App at http://localhost:5173")
        await page.goto("http://localhost:5173", wait_until="networkidle")
        await asyncio.sleep(3)
        
        # Show IDLE state
        print("    → IDLE state")
        await asyncio.sleep(3)
        
        # Click "Demo Voice" to simulate voice input → LISTENING
        print("    → Tap/click → LISTENING state")
        await page.click("#btn-demo-voice")
        await asyncio.sleep(4)
        
        # Click "Approve / Tap" to simulate ring tap → PICK_MERCHANT
        print("    → Ring tap → PICK_MERCHANT state")
        await page.click("#btn-approve")
        await asyncio.sleep(4)
        
        # Click "Approve / Tap" again to select merchant → CONFIRM
        print("    → Select merchant → CONFIRM state")
        await page.click("#btn-approve")
        await asyncio.sleep(4)
        
        # Click "Approve / Tap" again to confirm payment → PENDING → SUCCESS
        print("    → Confirm payment → PENDING → SUCCESS")
        await page.click("#btn-approve")
        await asyncio.sleep(5)
        
        # Show SUCCESS state
        print("    → SUCCESS state shown")
        await asyncio.sleep(3)
        
        # Reset for clean demo
        print("    → Reset")
        await page.click("#btn-reset")
        await asyncio.sleep(2)
        
        # ============================================================
        # PART 2: WEB APP - Admin Dashboard
        # ============================================================
        print("  → PART 2: Web Admin Dashboard at http://127.0.0.1:8787")
        await page.goto("http://127.0.0.1:8787", wait_until="networkidle")
        await asyncio.sleep(3)
        
        # Show full dashboard
        print("    → Full dashboard view")
        await asyncio.sleep(3)
        
        # Connect wallet
        print("    → Connect wallet")
        await page.click("#connect")
        await asyncio.sleep(3)
        
        # Show merchant picker with GPS distances
        print("    → Merchant picker with GPS distances")
        await page.click("#merchant")
        await asyncio.sleep(3)
        await page.keyboard.press("Escape")
        await asyncio.sleep(1)
        
        # Enter amount
        print("    → Enter amount 12.50 → USDC preview")
        await page.fill("#amount", "12.50")
        await asyncio.sleep(2)
        
        # Admin tab - onboarding
        print("    → Admin tab - merchant onboarding")
        await page.click("#tab-admin")
        await asyncio.sleep(3)
        await page.wait_for_selector("#m-name", timeout=5000)
        await page.fill("#m-name", "Demo Cafe")
        await page.fill("#m-address", "Demo Street, Bengaluru")
        await page.fill("#m-lat", "12.9716")
        await page.fill("#m-lng", "77.5946")
        await page.fill("#m-upi", "upi://pay?pa=demo@upi&pn=Demo%20Cafe&cu=INR")
        await asyncio.sleep(2)
        
        # Admin merchants list
        print("    → Admin merchants list")
        await asyncio.sleep(3)
        
        # Payment history
        print("    → Payment history")
        await asyncio.sleep(3)
        
        # Network panel
        print("    → Network panel (verified on-chain)")
        await page.click("#tab-user")
        await asyncio.sleep(2)
        await asyncio.sleep(3)
        
        # ============================================================
        # PART 3: ARCHITECTURE DIAGRAM
        # ============================================================
        print("  → PART 3: Architecture Diagram")
        await page.goto("file:///home/azureuser/Glance-Pay/architecture.excalidraw", wait_until="networkidle")
        await asyncio.sleep(5)
        
        # Scroll through diagram
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(3)
        await page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(3)
        
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