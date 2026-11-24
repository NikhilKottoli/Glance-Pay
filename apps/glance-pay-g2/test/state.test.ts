import { describe, test, expect, vi, beforeEach } from "vitest";
import { state, LensState, loadLastPayment, saveLastPayment, loadUserLocation } from "../src/state";

describe("state", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    // Reset state
    state.state = "IDLE";
    state.amount = null;
    state.merchant = null;
    state.merchantIndex = 0;
    state.merchants = [];
    state.txHash = null;
    state.emailId = null;
    state.transcript = null;
    state.userLocation = null;
  });

  describe("initial state", () => {
    test("starts in IDLE state", () => {
      expect(state.state).toBe("IDLE");
    });

    test("has null values for optional fields", () => {
      expect(state.amount).toBeNull();
      expect(state.merchant).toBeNull();
      expect(state.txHash).toBeNull();
      expect(state.emailId).toBeNull();
      expect(state.transcript).toBeNull();
      expect(state.userLocation).toBeNull();
    });

    test("has empty merchants array", () => {
      expect(state.merchants).toEqual([]);
    });

    test("merchantIndex starts at 0", () => {
      expect(state.merchantIndex).toBe(0);
    });
  });

  describe("LensState constants", () => {
    test("has all required states", () => {
      expect(LensState.IDLE).toBe("IDLE");
      expect(LensState.LISTENING).toBe("LISTENING");
      expect(LensState.PICK_MERCHANT).toBe("PICK_MERCHANT");
      expect(LensState.CONFIRM).toBe("CONFIRM");
      expect(LensState.PENDING).toBe("PENDING");
      expect(LensState.SUCCESS).toBe("SUCCESS");
      expect(LensState.FAILED).toBe("FAILED");
    });
  });

  describe("loadLastPayment / saveLastPayment", () => {
    test("saveLastPayment stores payment in localStorage", () => {
      saveLastPayment({ merchantId: "cafe-x", amount: 12.50 });
      const stored = localStorage.getItem("glancepay.lastPayment");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.merchantId).toBe("cafe-x");
      expect(parsed.amount).toBe(12.50);
    });

    test("loadLastPayment retrieves valid payment", () => {
      localStorage.setItem("glancepay.lastPayment", JSON.stringify({ merchantId: "blue-tokai", amount: 25.00 }));
      const result = loadLastPayment();
      expect(result).toEqual({ merchantId: "blue-tokai", amount: 25.00 });
    });

    test("loadLastPayment returns null for missing key", () => {
      expect(loadLastPayment()).toBeNull();
    });

    test("loadLastPayment returns null for corrupted data", () => {
      localStorage.setItem("glancepay.lastPayment", "not-valid-json");
      expect(loadLastPayment()).toBeNull();
    });

    test("loadLastPayment returns null for invalid structure", () => {
      localStorage.setItem("glancepay.lastPayment", JSON.stringify({ merchantId: 123, amount: "not-a-number" }));
      expect(loadLastPayment()).toBeNull();
    });

    test("loadLastPayment handles missing merchantId", () => {
      localStorage.setItem("glancepay.lastPayment", JSON.stringify({ amount: 12.50 }));
      expect(loadLastPayment()).toBeNull();
    });

    test("loadLastPayment handles missing amount", () => {
      localStorage.setItem("glancepay.lastPayment", JSON.stringify({ merchantId: "cafe-x" }));
      expect(loadLastPayment()).toBeNull();
    });

    test("loadLastPayment handles non-positive amount", () => {
      localStorage.setItem("glancepay.lastPayment", JSON.stringify({ merchantId: "cafe-x", amount: 0 }));
      expect(loadLastPayment()).toBeNull();
      
      localStorage.setItem("glancepay.lastPayment", JSON.stringify({ merchantId: "cafe-x", amount: -5 }));
      expect(loadLastPayment()).toBeNull();
    });
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

    test("handles geolocation permission denied", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => error(new GeolocationPositionError("PERMISSION_DENIED"))),
      };
      // @ts-ignore
      navigator.geolocation = mockGeolocation;
      
      const result = await loadUserLocation();
      expect(result).toBeNull();
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
  });
});