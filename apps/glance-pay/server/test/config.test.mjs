import { describe, test, expect, vi, beforeEach } from "vitest";

describe("server/config", () => {
  test("CHAIN config has correct values", async () => {
    const { CHAIN } = await import("../config.mjs");
    expect(CHAIN.chainId).toBe(11155111);
    expect(CHAIN.chainName).toBe("Ethereum Sepolia");
    expect(CHAIN.usdc).toBe("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
    expect(CHAIN.usdcDecimals).toBe(6);
    expect(CHAIN.explorer).toBe("https://sepolia.etherscan.io");
  });

  test("amountUnits converts INR to base units correctly", async () => {
    const { amountUnits } = await import("../config.mjs");
    expect(amountUnits(83)).toBe(1_000_000n);
    expect(amountUnits(12.50)).toBe(150602n);
    expect(amountUnits(0)).toBe(0n);
  });
});