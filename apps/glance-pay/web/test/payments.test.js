import { describe, test, expect, vi, beforeEach } from "vitest";

describe("web/payments", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test("previewSelection updates USDC amount", async () => {
    global.ethereum = {
      request: vi.fn(),
    };
    
    const { previewSelection, merchants } = await import("../payments");
    // Mock DOM elements
    document.body.innerHTML = `
      <select id="merchant"><option value="1">Test</option></select>
      <input id="amount" value="12.50" />
      <input id="usdc-amount" />
    `;
    
    merchants.push({ id: "1", name: "Test" });
    previewSelection();
    
    expect(document.getElementById("usdc-amount").value).toMatch(/≈ 0\.15/);
  });
});

describe("web/admin", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test("onboard-form submission calls API", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ merchant: { name: "Test Cafe" } })
    });
    
    const { onboardForm } = await import("../admin/form");
    document.body.innerHTML = `
      <form id="onboard-form">
        <input id="m-name" value="Test Cafe" />
        <input id="m-address" value="Test Street" />
        <input id="m-lat" value="12.9716" />
        <input id="m-lng" value="77.5946" />
        <input id="m-upi" value="upi://pay?pa=test@upi&cu=INR" />
        <input id="m-category" value="cafe" />
        <button type="submit">Add</button>
      </form>
    `;
    
    const form = document.getElementById("onboard-form");
    const submitEvent = new Event("submit", { cancelable: true });
    form.dispatchEvent(submitEvent);
    
    // Wait for async
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/merchants", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Test Cafe")
      }));
    });
  });
});