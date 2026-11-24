import { describe, test, expect, vi, beforeEach } from "vitest";

describe("server/verify/onchain", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("verifyOnChain", () => {
    test("throws on invalid tx hash format", async () => {
      const { verifyOnChain } = await import("../verify/onchain.mjs");
      await expect(verifyOnChain("invalid", 100)).rejects.toThrow("Invalid transaction hash");
      await expect(verifyOnChain("0x123", 100)).rejects.toThrow("Invalid transaction hash");
    });

    test("throws when transaction not mined", async () => {
      const { verifyOnChain } = await import("../verify/onchain.mjs");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: null })
      });
      
      await expect(verifyOnChain("0x" + "1".repeat(64), 100)).rejects.toThrow("Transaction not mined yet");
    });

    test("throws on reverted transaction", async () => {
      const { verifyOnChain } = await import("../verify/onchain.mjs");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: { status: "0x0" } })
      });
      
      await expect(verifyOnChain("0x" + "1".repeat(64), 100)).rejects.toThrow("Transaction reverted on-chain");
    });

    test("throws when not a USDC transfer", async () => {
      const { verifyOnChain } = await import("../verify/onchain.mjs");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            status: "0x1",
            to: "0x0000000000000000000000000000000000000000"
          }
        })
      });
      
      await expect(verifyOnChain("0x" + "1".repeat(64), 100)).rejects.toThrow("Transaction was not a USDC transfer");
    });

    test("throws when no Transfer event found", async () => {
      const { verifyOnChain } = await import("../verify/onchain.mjs");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            status: "0x1",
            to: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            logs: []
          }
        })
      });
      
      await expect(verifyOnChain("0x" + "1".repeat(64), 100)).rejects.toThrow("No USDC Transfer event found");
    });

    test("throws when wrong recipient", async () => {
      const { verifyOnChain } = await import("../verify/onchain.mjs");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            status: "0x1",
            to: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            logs: [{
              address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x" + "1".repeat(64),
                "0x" + "2".repeat(64)
              ],
              data: "0x" + "1000000"
            }]
          }
        })
      });
      
      await expect(verifyOnChain("0x" + "1".repeat(64), 100)).rejects.toThrow("Wrong recipient");
    });

    test("throws when underpaid", async () => {
      const { verifyOnChain } = await import("../verify/onchain.mjs");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            status: "0x1",
            to: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            logs: [{
              address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x" + "1".repeat(64),
                "0x" + "3".repeat(64)
              ],
              data: "0x100000" // 10 USDC, but expected ~12.5 USDC
            }]
          }
        })
      });
      
      await expect(verifyOnChain("0x" + "1".repeat(64), 100)).rejects.toThrow("Underpaid");
    });
  });
});