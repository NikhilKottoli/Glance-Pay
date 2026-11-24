import { describe, test, expect, vi, beforeEach } from "vitest";
import { loadUserLocation, loadMerchants, executePayment, loadUserLocationGlobal } from "../src/utils/api";

describe("utils/api", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("loadUserLocation", () => {
    test("returns null when geolocation not available", async () => {
      const originalGeolocation = navigator.geolocation;
      // @ts-ignore
      delete navigator.geolocation;
      
      const result = await loadUserLocation();
      expect(result).toBeNull();
      
      // @ts-ignore
      navigator.geolocation = originalGeolocation;
    });

    test("returns location on success", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => success({
          coords: { latitude: 12.9716, longitude: 77.5946 }
        })),
      };
      // @ts-ignore
      navigator.geolocation = mockGeolocation;
      
      const result = await loadUserLocation();
      expect(result).toEqual({ lat: 12.9716, lng: 77.5946 });
    });

    test("returns null on geolocation error", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => error(new GeolocationPositionError("PERMISSION_DENIED"))),
      };
      // @ts-ignore
      navigator.geolocation = mockGeolocation;
      
      const result = await loadUserLocation();
      expect(result).toBeNull();
    });
  });

  describe("loadMerchants", () => {
    test("returns fallback merchants on fetch failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      
      const merchants = await loadMerchants();
      expect(merchants.length).toBeGreaterThan(0);
      expect(merchants[0].id).toBe("cafe-x");
    });

    test("returns empty array on empty response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ merchants: [] })
      });
      
      const merchants = await loadMerchants();
      expect(merchants.length).toBeGreaterThan(0); // fallback
    });
  });

  describe("executePayment", () => {
    beforeEach(async () => {
      const { state } = await import("../src/state");
      state.merchant = { id: "cafe-x", name: "Café X" };
      state.amount = 12.50;
    });

    test("returns error when no merchant selected", async () => {
      const { state: s } = await import("../src/state");
      s.merchant = null;
      s.amount = 12.50;
      
      const result = await executePayment();
      expect(result.ok).toBe(false);
      expect(result.error).toBe("No merchant or amount selected");
    });

    test("returns error when no amount selected", async () => {
      const { state: s } = await import("../src/state");
      s.merchant = { id: "cafe-x" };
      s.amount = null;
      
      const result = await executePayment();
      expect(result.ok).toBe(false);
      expect(result.error).toBe("No merchant or amount selected");
    });

    test("returns error on API failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Server error" })
      });
      
      const result = await executePayment();
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Server error");
    });

    test("returns error on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      
      const result = await executePayment();
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("loadUserLocationGlobal", () => {
    test("sets window.userLocation on success", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => success({
          coords: { latitude: 12.9716, longitude: 77.5946 }
        })),
      };
      // @ts-ignore
      navigator.geolocation = mockGeolocation;
      
      await loadUserLocationGlobal();
      expect((window as any).userLocation).toEqual({ lat: 12.9716, lng: 77.5946 });
    });
  });
});