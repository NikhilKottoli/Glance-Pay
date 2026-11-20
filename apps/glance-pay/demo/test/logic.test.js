import test from "node:test";
import assert from "node:assert/strict";
import { StateMachine } from "../src/state-machine.js";
import { parseVoice } from "../src/parser.js";
import { loadMerchants, rankMerchants, distanceMeters, shortUpi } from "../src/merchants.js";

test("parser: required Indian-English phrases", () => {
  assert.deepEqual(parseVoice("pay 12.50"), { amount: 12.5 });
  assert.deepEqual(parseVoice("pay twelve fifty"), { amount: 12.5 });
  assert.deepEqual(parseVoice("pay 200 to Blue Tokai"), { amount: 200, merchantHint: "blue tokai" });
  assert.deepEqual(parseVoice("pay 50 rupees"), { amount: 50, currency: "INR" });
});

test("parser: rejects invalid amounts and over-limit", () => {
  assert.ok(parseVoice("pay 0").error);
  assert.ok(parseVoice("pay -5").error);
  assert.ok(parseVoice("pay 10000").error);
  assert.ok(parseVoice("hello").error);
  assert.ok(parseVoice("").error);
  assert.ok(parseVoice("pay 600", 500).error);
});

test("state machine: happy path and illegal transition", () => {
  const sm = new StateMachine();
  for (const s of ["LISTENING", "AMOUNT_HEARD", "RESOLVING", "CONFIRM", "SIGNING", "PENDING", "SUCCESS"]) {
    assert.equal(sm.transition(s), s);
  }
  assert.throws(() => new StateMachine().transition("SUCCESS"), /Illegal transition/);
  const sm2 = new StateMachine();
  sm2.transition("LISTENING");
  assert.throws(() => sm2.transition("SIGNING"), /Illegal transition/);
});

test("state machine: stale quote re-quote path", () => {
  const sm = new StateMachine();
  ["LISTENING", "AMOUNT_HEARD", "RESOLVING", "CONFIRM", "RESOLVING", "CONFIRM"].forEach((s) => sm.transition(s));
  assert.equal(sm.state, "CONFIRM");
});

const registry = [
  { id: "a", name: "Café X", address: "1 St", category: "cafe", lat: 12.9716, lng: 77.5946, upiUri: "upi://pay?pa=a@upi&cu=INR", aliases: ["cafe x"] },
  { id: "b", name: "Blue Tokai", address: "2 St", category: "cafe", lat: 12.97172, lng: 77.59475, upiUri: "upi://pay?pa=b@upi&cu=INR", aliases: ["blue", "tokai"] },
  { id: "c", name: "Chai Point", address: "3 St", category: "tea", lat: 12.9719, lng: 77.5951, upiUri: "upi://pay?pa=c@upi&cu=INR", aliases: ["chai"] },
];

test("merchants: close pair, hint override, no match, poor GPS", () => {
  loadMerchants(registry);
  const gps = { lat: 12.97164, lng: 77.59466 };
  const close = rankMerchants(registry, gps, null, 5);
  assert.equal(close.length, 3);
  assert.ok(distanceMeters(registry[0], registry[1]) <= 30);

  const hinted = rankMerchants(registry, gps, "blue tokai", 5);
  assert.equal(hinted[0].merchant.id, "b");

  assert.equal(rankMerchants(registry, { lat: 13, lng: 77.7 }, null, 5).length, 0);
  assert.ok(rankMerchants(registry, gps, null, 5)[0].distance > 0);
  assert.equal(shortUpi("upi://pay?pa=abcdefghijklmnopqrst@upi&cu=INR").length <= 19, true);
});

test("merchants: invalid UPI URI rejected at load", () => {
  assert.throws(() => loadMerchants([{ ...registry[0], upiUri: "not-a-upi-uri" }]), /invalid upiUri/);
});
