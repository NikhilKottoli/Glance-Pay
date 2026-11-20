// Glance Pay deployable demo server.
// Payout is an interface: the default stub emails a receipt via Resend; a real
// bank/UPI API can be dropped in by implementing PayoutProvider and setting
// PAYOUT_PROVIDER=bank. No secrets are logged or returned to the browser.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const WEB = path.resolve(__dirname, "../web");
const DATA = path.join(__dirname, "data");
fs.mkdirSync(DATA, { recursive: true });

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, "utf8").trim().split("\n").filter((l) => l && !l.startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
  );
}
const env = { ...loadEnv(), ...process.env };
const PORT = Number(env.PORT || 8787);
const EMAIL_TO = env.PAYOUT_EMAIL_TO || "nikhilkottoli2005@gmail.com";

const MERCHANTS_FILE = path.join(DATA, "merchants.json");
const PAYMENTS_FILE = path.join(DATA, "payments.json");
const readJson = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return fallback; } };
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2));

if (!fs.existsSync(MERCHANTS_FILE)) {
  const seed = readJson(path.resolve(__dirname, "../demo/data/merchants.json"), []);
  writeJson(MERCHANTS_FILE, seed);
}

// ---------------- Payout provider interface ----------------
class PayoutProvider {
  get name() { return "abstract"; }
  async pay() { throw new Error("Not implemented"); }
}

class StubEmailPayoutProvider extends PayoutProvider {
  get name() { return "stub-email"; }
  async pay({ merchant, amount }) {
    const key = env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Glance Pay <onboarding@resend.dev>",
        to: EMAIL_TO,
        subject: `Glance Pay — paid ₹${amount.toFixed(2)} to ${merchant.name}`,
        html: `<h2>Payment receipt — Glance Pay (testnet demo)</h2>
               <p><b>Merchant:</b> ${merchant.name}</p>
               <p><b>Amount:</b> ₹${amount.toFixed(2)} (≈ ${(amount / 83).toFixed(2)} USDC)</p>
               <p><b>UPI handle:</b> ${merchant.upiUri}</p>
               <p><b>Status:</b> PAID (mock payout)</p>
               <p style="color:#666">No real money moved. This stub exists so a real bank/UPI API can be swapped in later.</p>`,
      }),
    });
    if (!res.ok) throw new Error(`Receipt email failed (${res.status})`);
    const data = await res.json();
    return { provider: this.name, emailId: data.id, state: "COMPLETED" };
  }
}

// Drop-in point for a real bank/UPI rail. Implement pay() against the bank's
// API (signed request, idempotency key, webhook for settlement), then set
// PAYOUT_PROVIDER=bank. Nothing else in this server needs to change.
class BankApiPayoutProvider extends PayoutProvider {
  get name() { return "bank"; }
  async pay() { throw new Error("Bank payout API not configured — implement BankApiPayoutProvider.pay()"); }
}

const provider = env.PAYOUT_PROVIDER === "bank" ? new BankApiPayoutProvider() : new StubEmailPayoutProvider();

// ---------------- helpers ----------------
const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" });
  res.end(JSON.stringify(body));
};
async function body(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}
const UPIS = /^upi:\/\/pay\?pa=[^&\s]+/;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

// ---------------- API ----------------
async function api(req, res, url) {
  if (url.pathname === "/api/health") {
    return json(res, 200, { ok: true, provider: provider.name, emailTo: EMAIL_TO, time: new Date().toISOString() });
  }
  if (url.pathname === "/api/merchants" && req.method === "GET") {
    return json(res, 200, { merchants: readJson(MERCHANTS_FILE, []) });
  }
  if (url.pathname === "/api/merchants" && req.method === "POST") {
    const b = await body(req);
    if (!b.name || !b.address || !UPIS.test(b.upiUri || "") ||
        !Number.isFinite(Number(b.lat)) || !Number.isFinite(Number(b.lng))) {
      return json(res, 400, { error: "name, address, valid UPI URI and numeric lat/lng are required" });
    }
    const merchants = readJson(MERCHANTS_FILE, []);
    const m = {
      id: `${String(b.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36).slice(-5)}`,
      name: String(b.name).trim(), address: String(b.address).trim(),
      lat: Number(b.lat), lng: Number(b.lng), upiUri: String(b.upiUri).trim(),
      category: b.category || "cafe", aliases: [String(b.name).toLowerCase()],
    };
    merchants.push(m);
    writeJson(MERCHANTS_FILE, merchants);
    return json(res, 201, { merchant: m });
  }
  if (url.pathname === "/api/payments" && req.method === "GET") {
    return json(res, 200, { payments: readJson(PAYMENTS_FILE, []) });
  }
  if (url.pathname === "/api/pay" && req.method === "POST") {
    const b = await body(req);
    const merchants = readJson(MERCHANTS_FILE, []);
    const merchant = merchants.find((m) => m.id === b.merchantId);
    const amount = Number(b.amount);
    if (!merchant) return json(res, 400, { error: "Unknown merchant" });
    if (!Number.isFinite(amount) || amount <= 0 || amount > 500) {
      return json(res, 400, { error: "Amount must be between 0 and 500 INR" });
    }
    try {
      const result = await provider.pay({ merchant, amount, wallet: b.wallet });
      const payment = {
        id: `pay-${Date.now().toString(36)}`, time: new Date().toISOString(),
        merchantId: merchant.id, merchant: merchant.name, amount,
        usdc: Number((amount / 83).toFixed(2)), wallet: b.wallet || "unconnected",
        state: "RELEASED", txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`,
        provider: result.provider, emailId: result.emailId || null,
      };
      const payments = readJson(PAYMENTS_FILE, []);
      payments.unshift(payment);
      writeJson(PAYMENTS_FILE, payments.slice(0, 50));
      return json(res, 200, { ok: true, payment, receiptEmail: EMAIL_TO });
    } catch (e) {
      return json(res, 502, { error: e.message });
    }
  }
  return json(res, 404, { error: "Not found" });
}

// ---------------- static ----------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (url.pathname.startsWith("/api/")) return api(req, res, url);
  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  const full = path.join(WEB, path.normalize(file).replace(/^(\.\.[/\\])+/, ""));
  if (!full.startsWith(WEB) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream" });
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Glance Pay demo listening on http://0.0.0.0:${PORT} (payout provider: ${provider.name})`);
});
