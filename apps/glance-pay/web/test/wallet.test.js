import { describe, test, expect, vi, beforeEach } from "vitest";

describe("web/wallet", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.ethereum = undefined;
  });

  test("short formats address correctly", async () => {
    const { short } = await import("../wallet/ethereum");
    expect(short("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
    expect(short("0xabcd")).toBe("0xab…abcd");
    expect(short("")).toBe("—");
    expect(short(null)).toBe("—");
    expect(short(undefined)).toBe("—");
  });

  test("pad32 pads hex to 64 chars", async () => {
    const { pad32 } = await import("../wallet/ethereum");
    expect(pad32("0x1")).toBe("0000000000000000000000000000000000000000000000000000000000000001");
    expect(pad32("0xabc")).toBe("0000000000000000000000000000000000000000000000000000000000000abc");
    expect(pad32("0x" + "a".repeat(64))).toBe("0x" + "a".repeat(64));
  });

  test("units converts INR to USDC base units", async () => {
    const { units } = await import("../wallet/ethereum");
    expect(units(83)).toBe(1_000_000n); // 83 INR = 1 USDC = 1,000,000 base units
    expect(units(12.50)).toBe(150_602n); // 12.50 INR ≈ 0.1506 USDC
    expect(units(0)).toBe(0n);
  });
});