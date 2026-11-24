import { describe, test, expect, vi, beforeEach } from "vitest";

describe("web/utils/api", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test("api throws on error response", async () => {
    const { api } = await import("../utils/api");
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Server error" })
    });
    
    await expect(api("/test")).rejects.toThrow("Server error");
  });

  test("api throws on network error", async () => {
    const { api } = await import("../utils/api");
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    
    await expect(api("/test")).rejects.toThrow("Network error");
  });

  test("api returns parsed JSON on success", async () => {
    const { api } = await import("../utils/api");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: "test" })
    });
    
    const result = await api("/test");
    expect(result).toEqual({ data: "test" });
  });
});

describe("web/utils/storage", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  test("loadLastPayment returns null when empty", async () => {
    const { loadLastPayment } = await import("../utils/storage");
    expect(loadLastPayment()).toBeNull();
  });

  test("saveLastPayment and loadLastPayment roundtrip", async () => {
    const { saveLastPayment, loadLastPayment } = await import("../utils/storage");
    saveLastPayment({ merchantId: "cafe-x", amount: 12.50 });
    const loaded = loadLastPayment();
    expect(loaded).toEqual({ merchantId: "cafe-x", amount: 12.50 });
  });

  test("loadLastPayment handles corrupted data", async () => {
    const { loadLastPayment } = await import("../utils/storage");
    localStorage.setItem("glancepay.lastPayment", "not-json");
    expect(loadLastPayment()).toBeNull();
  });
});

describe("web/utils/geo", () => {
  test("haversineMeters calculates distance", () => {
    const { haversineMeters } = await import("../utils/geo");
    const a = { lat: 12.9716, lng: 77.5946 };
    const b = { lat: 12.97172, lng: 77.59475 };
    const distance = haversineMeters(a, b);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(100);
  });

  test("haversineMeters returns 0 for same point", async () => {
    const { haversineMeters } = await import("../utils/geo");
    const a = { lat: 12.9716, lng: 77.5946 };
    expect(haversineMeters(a, a)).toBe(0);
  });

  test("sortMerchantsByDistance sorts by distance", async () => {
    const { sortMerchantsByDistance } = await import("../utils/geo");
    const merchants = [
      { id: "1", name: "Far", lat: 13.0, lng: 77.6 },
      { id: "2", name: "Near", lat: 12.9716, lng: 77.5946 },
    ];
    const origin = { lat: 12.9716, lng: 77.5946 };
    const sorted = sortMerchantsByDistance(merchants, origin);
    expect(sorted[0].id).toBe("2");
  });

  test("sortMerchantsByDistance returns copy when no origin", async () => {
    const { sortMerchantsByDistance } = await import("../utils/geo");
    const merchants = [{ id: "1", lat: 0, lng: 0 }];
    const sorted = sortMerchantsByDistance(merchants, null);
    expect(sorted).not.toBe(merchants);
    expect(sorted).toEqual(merchants);
  });
});

describe("web/utils/tts", () => {
  test("speak doesn't throw when speechSynthesis unavailable", async () => {
    const originalSpeechSynthesis = window.speechSynthesis;
    // @ts-ignore
    delete window.speechSynthesis;
    
    const { speak } = await import("../utils/tts");
    expect(() => speak("test")).not.toThrow();
    
    window.speechSynthesis = originalSpeechSynthesis;
  });
});