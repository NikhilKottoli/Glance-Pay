import test from "node:test";
import assert from "node:assert/strict";
import { ROLE, can, assertCan, permissionsFor } from "../src/roles.js";
import { validateMerchantInput, mergeMerchants, paymentRecord } from "../src/store.js";

test("user can connect wallet and view payments, but cannot onboard merchants", () => {
  assert.equal(can(ROLE.USER, "wallet:connect"), true);
  assert.equal(can(ROLE.USER, "payments:view"), true);
  assert.equal(can(ROLE.USER, "merchant:onboard"), false);
  assert.equal(can(ROLE.USER, "payment:simulate"), false);
  assert.throws(() => assertCan(ROLE.USER, "merchant:onboard"), /not allowed/);
});

test("admin can onboard merchants and simulate payments", () => {
  assert.equal(can(ROLE.ADMIN, "merchant:onboard"), true);
  assert.equal(can(ROLE.ADMIN, "merchant:view"), true);
  assert.equal(can(ROLE.ADMIN, "payment:simulate"), true);
  assert.equal(can(ROLE.ADMIN, "wallet:connect"), false);
  assert.deepEqual(permissionsFor(ROLE.ADMIN).sort(),
    ["merchant:onboard", "merchant:view", "payment:simulate", "payments:view"]);
});

test("merchant onboarding validates UPI URI and coordinates", () => {
  const good = validateMerchantInput({
    name: "Café X", address: "12 Church St", lat: "12.9716", lng: "77.5946",
    upiUri: "upi://pay?pa=cafex@upi&cu=INR", category: "cafe", aliases: "cafe x, coffee",
  });
  assert.equal(good.error, undefined);
  assert.match(good.merchant.id, /^cafe-x-/);
  assert.ok(good.merchant.aliases.includes("coffee"));

  assert.match(validateMerchantInput({ upiUri: "nope", lat: 12, lng: 77, name: "X", address: "Y" }).error, /UPI URI/);
  assert.match(validateMerchantInput({ upiUri: "upi://pay?pa=a@b", lat: 999, lng: 77, name: "X", address: "Y" }).error, /Latitude/);
});

test("onboarded merchants merge without duplicating seed ids", () => {
  const seed = [{ id: "a", name: "A" }];
  const added = [{ id: "a", name: "dup" }, { id: "b", name: "B" }];
  assert.deepEqual(mergeMerchants(seed, added).map((m) => m.id), ["a", "b"]);
});

test("payment records carry no secret material", () => {
  const p = paymentRecord({ merchant: "Café X", amount: 12.5, usdc: "0.15", state: "SUCCESS", tx: "0xabc", wallet: "0xme" });
  assert.equal(p.state, "SUCCESS");
  assert.equal(p.wallet, "0xme");
  assert.equal(JSON.stringify(p).includes("token"), false);
});
