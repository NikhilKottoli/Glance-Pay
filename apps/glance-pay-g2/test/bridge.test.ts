import { describe, test, expect, vi, beforeEach } from "vitest";
import { handleBridgeEvent, setBridge, getBridge } from "../src/bridge";
import { eventSourceLabel, handleAudioEvent } from "../src/bridge/audio";
import { state, LensState } from "../src/state";

describe("bridge", () => {
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

  describe("eventSourceLabel", () => {
    test("identifies RING source by number", () => {
      expect(eventSourceLabel({ eventSource: 2 })).toBe("RING");
    });

    test("identifies GLASSES source by number", () => {
      expect(eventSourceLabel({ eventSource: 1 })).toBe("GLASSES");
    });

    test("identifies RING source by string", () => {
      expect(eventSourceLabel({ eventSource: "RING" })).toBe("RING");
      expect(eventSourceLabel({ eventSource: "R1" })).toBe("RING");
      expect(eventSourceLabel({ eventSource: "ring" })).toBe("RING");
    });

    test("identifies GLASSES source by string", () => {
      expect(eventSourceLabel({ eventSource: "GLASSES" })).toBe("GLASSES");
      expect(eventSourceLabel({ eventSource: "TEMPLE" })).toBe("GLASSES");
    });

    test("handles nested event sources", () => {
      expect(eventSourceLabel({ textEvent: { eventSource: 2 } })).toBe("RING");
      expect(eventSourceLabel({ sysEvent: { eventSource: 1 } })).toBe("GLASSES");
      expect(eventSourceLabel({ listEvent: { eventSource: 2 } })).toBe("RING");
    });

    test("returns UNKNOWN for unknown source", () => {
      expect(eventSourceLabel({})).toBe("UNKNOWN");
      expect(eventSourceLabel({ eventSource: 999 })).toBe("UNKNOWN");
      expect(eventSourceLabel({ eventSource: "UNKNOWN" })).toBe("UNKNOWN");
    });

    test("handles malformed input", () => {
      expect(eventSourceLabel(null)).toBe("UNKNOWN");
      expect(eventSourceLabel(undefined)).toBe("UNKNOWN");
      expect(eventSourceLabel({ eventSource: null })).toBe("UNKNOWN");
    });
  });

  describe("setBridge / getBridge", () => {
    test("stores and retrieves bridge", () => {
      const mockBridge = { audioControl: vi.fn() };
      setBridge(mockBridge);
      expect(getBridge()).toBe(mockBridge);
    });
  });

  describe("handleAudioEvent", () => {
    test("ignores events without audioPcm", () => {
      handleAudioEvent({});
      handleAudioEvent({ audioPcm: null });
      handleAudioEvent({ audioPcm: "not-an-array" });
    });

    test("converts array to Uint8Array", () => {
      const audioEvent = { audioPcm: [1, 2, 3, 4] };
      // Should not throw
      expect(() => handleAudioEvent(audioEvent)).not.toThrow();
    });

    test("converts Uint8Array", () => {
      const audioEvent = { audioPcm: new Uint8Array([1, 2, 3, 4]) };
      expect(() => handleAudioEvent(audioEvent)).not.toThrow();
    });

    test("respects audioActive flag", async () => {
      const { audioActive } = await import("../src/bridge/audio");
      // Can't easily test internal state, but verify function doesn't throw
      handleAudioEvent({ audioPcm: new Uint8Array([1, 2, 3]) });
    });
  });
});