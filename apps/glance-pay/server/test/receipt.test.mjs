import { describe, test, expect, vi, beforeEach } from "vitest";

describe("server/receipt/email", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.RESEND_API_KEY = "test-key";
    process.env.PAYOUT_EMAIL_TO = "test@example.com";
  });

  test("sendReceiptEmail throws when RESEND_API_KEY missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendReceiptEmail } = await import("../receipt/email.mjs");
    await expect(sendReceiptEmail({
      merchant: { name: "Test", upiUri: "upi://pay" },
      amount: 12.50,
      usdc: 0.15,
      wallet: "0x123",
      verification: { blockNumber: 123 },
      txHash: "0x123"
    })).rejects.toThrow("RESEND_API_KEY is not configured");
  });

  test("sendReceiptEmail sends email via Resend API", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email-123" })
    });
    
    const { sendReceiptEmail } = await import("../receipt/email.mjs");
    const result = await sendReceiptEmail({
      merchant: { name: "Test Cafe", upiUri: "upi://pay?pa=test@upi" },
      amount: 12.50,
      usdc: 0.15,
      wallet: "0x1234567890abcdef",
      verification: { blockNumber: 12345, from: "0x123", to: "0x456", value: "150602", gasUsed: "50000" },
      txHash: "0xabc123"
    });
    
    expect(result).toBe("email-123");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json"
        }),
        body: expect.stringContaining("Test Cafe")
      })
    });
  });

  test("sendReceiptEmail throws on API error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "API error" })
    });
    
    const { sendReceiptEmail } = await import("../receipt/email.mjs");
    await expect(sendReceiptEmail({
      merchant: { name: "Test", upiUri: "upi://pay" },
      amount: 12.50,
      usdc: 0.15,
      wallet: "0x123",
      verification: { blockNumber: 123 },
      txHash: "0x123"
    })).rejects.toThrow("Receipt email failed (500)");
  });
});