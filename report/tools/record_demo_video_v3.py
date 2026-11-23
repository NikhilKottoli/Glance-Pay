#!/usr/bin/env python3
"""Record a proper hackathon demo video of Glance Pay - ~60 seconds."""

import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright


async def main():
    output_path = Path(__file__).resolve().parents[2] / "report" / "glance-pay-real-demo-final.mp4"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            record_video_dir=str(output_path.parent),
            record_video_size={"width": 1280, "height": 720},
            viewport={"width": 1280, "height": 720}
        )
        page = await context.new_page()
        
        print("🎬 Recording FINAL demo video (~60s)...")
        
        # ===== HOOK (5s) =====
        print("  → HOOK: Opening web panel - problem + audience")
        await page.goto("http://127.0.0.1:8787", wait_until="networkidle")
        await page.wait_for_selector("#connect", timeout=10000)
        await page.wait_for_timeout(3000)
        
        # ===== STEP 1: Connect Wallet (10s) =====
        print("  → STEP 1: Connect wallet (MetaMask, Sepolia)")
        await page.click("#connect")
        await page.wait_for_timeout(3000)
        
        # ===== STEP 2: Merchant Picker with GPS (8s) =====
        print("  → STEP 2: Merchant picker with GPS distances")
        await page.wait_for_selector("#merchant", timeout=5000)
        await page.click("#merchant")
        await page.wait_for_timeout(2000)
        await page.keyboard.press("ArrowDown")
        await page.wait_for_timeout(1000)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(1000)
        
        # ===== STEP 3: Enter Amount + USDC Preview (8s) =====
        print("  → STEP 3: Enter amount → USDC preview")
        await page.fill("#amount", "12.50")
        await page.wait_for_timeout(2000)
        
        # ===== STEP 4: Pay Tab Active (3s) =====
        print("  → STEP 4: Pay tab - ready to sign")
        await page.click("#tab-user")
        await page.wait_for_timeout(1500)
        
        # ===== STEP 5: Admin Dashboard (8s) =====
        print("  → STEP 5: Admin dashboard - onboard merchants")
        await page.click("#tab-admin")
        await page.wait_for_timeout(3000)
        await page.wait_for_selector("#m-name", timeout=5000)
        await page.wait_for_timeout(2000)
        
        # ===== STEP 6: Back to Pay + Network Panel (8s) =====
        print("  → STEP 6: Back to Pay → Network panel (verified on-chain)")
        await page.click("#tab-user")
        await page.wait_for_timeout(1500)
        await page.wait_for_timeout(2000)
        
        # ===== STEP 7: G2 Lens App (12s) =====
        print("  → STEP 7: G2 Lens App - IDLE → LISTENING")
        await page.goto("http://localhost:5173", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        # G2 IDLE state
        print("    → G2 IDLE state (3 lines of green text)")
        await page.wait_for_timeout(3000)
        
        # Tap → LISTENING
        print("    → Tap → LISTENING state")
        await page.click("body")
        await page.wait_for_timeout(4000)
        
        # ===== FINAL HOLD (5s) =====
        print("  → FINAL: Holding G2 LISTENING view")
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