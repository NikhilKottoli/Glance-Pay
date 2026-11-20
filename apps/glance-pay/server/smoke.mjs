// Smoke test for the deployed demo API (sends one real receipt email).
const base = process.env.API_BASE || "http://127.0.0.1:8787";
const get = async (p) => (await fetch(base + p)).json();
const post = async (p, b) => (await fetch(base + p, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
})).json();

const health = await get("/api/health");
const merchants = await get("/api/merchants");
console.log("health:", JSON.stringify(health));
console.log("merchants:", merchants.merchants.length);
const m = merchants.merchants[0];
const pay = await post("/api/pay", { merchantId: m.id, amount: 12.5, wallet: "0xsmoke" });
console.log("pay ok:", pay.ok, "state:", pay.payment?.state,
  "emailId:", pay.payment?.emailId, "error:", pay.error || "-");
const payments = await get("/api/payments");
console.log("payments stored:", payments.payments.length);
