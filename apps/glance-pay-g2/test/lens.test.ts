import { describe, test, expect, vi, beforeEach } from "vitest";
import { lensText, renderLens, transition, LensState } from "../src/lens";
import { state } from "../src/state";

describe("lens", () => {
  beforeEach(() => {
    vi.resetModules();
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

  describe("lensText", () => {
    test("IDLE state shows default text", () => {
      state.state = "IDLE";
      const [l1, l2, l3] = lensText(state);
      expect(l1).toBe("Glance Pay");
      expect(l2).toBe("Ring or tap to pay");
      expect(l3).toBe("Say an amount");
    });

    test("IDLE state shows smart default when last payment exists", () => {
      state.state = "IDLE";
      state.merchants = [{ id: "cafe-x", name: "Café X", lat: 0, lng: 0 }];
      localStorage.setItem("glancepay.lastPayment", JSON.stringify({ merchantId: "cafe-x", amount: 12.50 }));
      
      const [l1, l2, l3] = lensText(state);
      expect(l1).toBe("Glance Pay");
      expect(l2).toContain("Again? Rs 12.50");
      expect(l3).toContain("Café X");
    });

    test("LISTENING state", () => {
      state.state = "LISTENING";
      const [l1, l2, l3] = lensText(state);
      expect(l1).toBe("Listening...");
      expect(l2).toBe("Say: pay 12.50");
      expect(l3).toBe("");
    });

    test("PICK_MERCHANT shows merchant list", () => {
      state.state = "PICK_MERCHANT";
      state.merchants = [
        { id: "1", name: "Café X", lat: 0, lng: 0 },
        { id: "2", name: "Blue Tokai", lat: 0, lng: 0 },
      ];
      state.merchantIndex = 0;
      
      const [l1, l2, l3] = lensText(state);
      expect(l1).toBe("Pick merchant");
      expect(l2).toContain(">1. Café X");
      expect(l2).toContain("2. Blue Tokai");
    });

    test("PICK_MERCHANT shows distance hint", () => {
      state.state = "PICK_MERCHANT";
      state.merchants = [{ id: "1", name: "Café X", lat: 12.9716, lng: 77.5946 }];
      state.merchantIndex = 0;
      state.userLocation = { lat: 12.9716, lng: 77.5946 };
      
      const [l1, l2, l3] = lensText(state);
      expect(l3).toContain("m away");
    });

    test("CONFIRM shows merchant, amount, and USDC", () => {
      state.state = "CONFIRM";
      state.merchant = { id: "cafe-x", name: "Café X", lat: 0, lng: 0, upiUri: "", category: "", aliases: [] };
      state.amount = 12.50;
      
      const [l1, l2, l3] = lensText(state);
      expect(l1).toBe("Café X");
      expect(l2).toContain("Rs 12.50");
      expect(l2).toContain("USDC");
      expect(l3).toBe("Tap to pay - ring cancel");
    });

    test("PENDING state", () => {
      state.state = "PENDING";
      const [l1, l2, l3] = lensText(state);
      expect(l1).toBe("Paying...");
      expect(l2).toBe("Onchain");
      expect(l3).toBe("");
    });

    test("SUCCESS state", () => {
      state.state = "SUCCESS";
      state.merchant = { name: "Café X" };
      state.amount = 12.50;
      
      const [l1, l2, l3] = lensText(state);
      expect(l1).toContain("Paid");
      expect(l1).toContain("12.50");
      expect(l2).toBe("Café X");
      expect(l3).toBe("Receipt emailed");
    });

    test("FAILED state", () => {
      state.state = "FAILED";
      const [l1, l2, l3] = lensText(state);
      expect(l1).toBe("Failed");
      expect(l2).toBe("No charge made");
      expect(l3).toBe("Tap to retry");
    });

    test("default case returns default text", () => {
      state.state = "UNKNOWN" as any;
      const [l1, l2, l3] = lensText(state);
      expect(l1).toBe("Glance Pay");
      expect(l2).toBe("");
      expect(l3).toBe("");
    });
  });

  describe("transition", () => {
    test("updates state", async () => {
      expect(state.state).toBe("IDLE");
      await transition("LISTENING", null);
      expect(state.state).toBe("LISTENING");
    });

    test("changes state correctly", async () => {
      await transition("CONFIRM", null);
      expect(state.state).toBe("CONFIRM");
      
      await transition("SUCCESS", null);
      expect(state.state).toBe("SUCCESS");
      
      await transition("FAILED", null);
      expect(state.state).toBe("FAILED");
      
      await transition("IDLE", null);
      expect(state.state).toBe("IDLE");
    });
  });
});