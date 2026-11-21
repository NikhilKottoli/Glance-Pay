// Glance Pay — single real demo app server.
// Flow: browser wallet signs a real Ethereum Sepolia USDC transfer → backend verifies the
// on-chain receipt → backend emails the receipt via Resend. No mock payout path exists.
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

const CHAIN = Object.freeze({
  chainId: 11155111,
  chainName: "Ethereum Sepolia",
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorer: "https://sepolia.etherscan.io",
  usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Circle docs, 6 decimals
  treasury: (env.PAYOUT_TREASURY_ADDRESS || "0x1111111111111111111111111111111111111111").toLowerCase(),
  usdcDecimals: 6,
});
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const MERCHANTS_FILE = path.join(DATA, "merchants.json");
const PAYMENTS_FILE = path.join(DATA, "payments.json");
const readJson = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return fallback; } };
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2));
if (!fs.existsSync(MERCHANTS_FILE)) {
  writeJson(MERCHANTS_FILE, [
    { id: "cafe-x", name: "Café X", address: "Church St, Bengaluru", lat: 12.9716, lng: 77.5946,
      upiUri: "upi://pay?pa=cafex@upi&pn=Cafe%20X&cu=INR", category: "cafe", aliases: ["cafe x"] },
    { id: "blue-tokai", name: "Blue Tokai", address: "Church St, Bengaluru", lat: 12.97172, lng: 77.59475,
      upiUri: "upi://pay?pa=bluetokai@okaxis&pn=Blue%20Tokai&cu=INR", category: "cafe", aliases: ["blue tokai"] },
    { id: "chai-point", name: "Chai Point", address: "Church St, Bengaluru", lat: 12.9719, lng: 77.5951,
      upiUri: "upi://pay?pa=chaipoint@ybl&pn=Chai%20Point&cu=INR", category: "tea", aliases: ["chai point"] },
  ]);
}

async function rpc(method, params = []) {
  const res = await fetch(CHAIN.rpcUrl, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} failed (${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "RPC error");
  return data.result;
}
const amountUnits = (inr) => BigInt(Math.round((Number(inr) * 1_000_000) / 83));

async function verifyOnChain(txHash, amountInr) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash || "")) throw new Error("Invalid transaction hash");
  let receipt = null;
  for (let i = 0; i < 10 && !receipt; i++) {
    receipt = await rpc("eth_getTransactionReceipt", [txHash]);
    if (!receipt) await new Promise((r) => setTimeout(r, 1000));
  }
  if (!receipt) throw new Error("Transaction not mined yet — try again in a moment");
  if (receipt.status !== "0x1") throw new Error("Transaction reverted on-chain");
  if ((receipt.to || "").toLowerCase() !== CHAIN.usdc.toLowerCase()) throw new Error("Transaction was not a USDC transfer");

  const expected = amountUnits(amountInr);
  const transfer = (receipt.logs || []).find((l) =>
    (l.address || "").toLowerCase() === CHAIN.usdc.toLowerCase() && l.topics?.[0] === TRANSFER_TOPIC && l.topics?.[2]);
  if (!transfer) throw new Error("No USDC Transfer event found in the transaction");
  const to = "0x" + transfer.topics[2].slice(-40).toLowerCase();
  const from = "0x" + (transfer.topics[1] || "").slice(-40).toLowerCase();
  const value = BigInt(transfer.data);
  if (to !== CHAIN.treasury) throw new Error("Wrong recipient — payment not credited");
  if (value < expected) throw new Error(`Underpaid: expected ${expected} base units, got ${value}`);
  return { from, to, value: value.toString(), blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed };
}

async function sendReceiptEmail({ merchant, amount, usdc, wallet, verification, txHash }) {
  const key = env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  const link = `${CHAIN.explorer}/tx/${txHash}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Glance Pay <onboarding@resend.dev>",
      to: EMAIL_TO,
      subject: `Glance Pay — paid ₹${amount.toFixed(2)} to ${merchant.name}`,
      html: `<h2>Payment receipt — Glance Pay</h2>
             <p><b>Merchant:</b> ${merchant.name}</p>
             <p><b>Amount:</b> ₹${amount.toFixed(2)} (${usdc} USDC on Ethereum Sepolia)</p>
             <p><b>UPI handle:</b> ${merchant.upiUri}</p>
             <p><b>Payer:</b> ${wallet}</p>
             <p><b>On-chain tx:</b> <a href="${link}">${txHash}</a> (block ${verification.blockNumber})</p>
             <p><b>Status:</b> VERIFIED ON-CHAIN · receipt sent</p>
             <p style="color:#666">Testnet only — test USDC has no real value. The bank/UPI payout step is represented by this receipt email in the hackathon build.</p>`,
    }),
  });
  if (!res.ok) throw new Error(`Receipt email failed (${res.status})`);
  return (await res.json()).id;
}

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
const UPI_RE = /^upi:\/\/pay\?pa=[^&\s]+/;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

async function api(req, res, url) {
  if (url.pathname === "/api/health") {
    return json(res, 200, { ok: true, mode: "real-onchain-testnet", chain: CHAIN.chainName,
      chainId: CHAIN.chainId, emailTo: EMAIL_TO, time: new Date().toISOString() });
  }
  if (url.pathname === "/api/chain") return json(res, 200, CHAIN);
  if (url.pathname === "/api/merchants" && req.method === "GET") {
    return json(res, 200, { merchants: readJson(MERCHANTS_FILE, []) });
  }
  if (url.pathname === "/api/merchants" && req.method === "POST") {
    const b = await body(req);
    if (!b.name || !b.address || !UPI_RE.test(b.upiUri || "") ||
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
    const merchant = readJson(MERCHANTS_FILE, []).find((m) => m.id === b.merchantId);
    const amount = Number(b.amount);
    if (!merchant) return json(res, 400, { error: "Unknown merchant" });
    if (!Number.isFinite(amount) || amount <= 0 || amount > 500) {
      return json(res, 400, { error: "Amount must be between 0 and 500 INR" });
    }
    try {
      const verified = await verifyOnChain(b.txHash, amount);
      const usdc = Number(amountUnits(amount)) / 1_000_000;
      const emailId = await sendReceiptEmail({ merchant, amount, usdc, wallet: b.wallet, verification: verified, txHash: b.txHash });
      const payment = {
        id: `pay-${Date.now().toString(36)}`, time: new Date().toISOString(),
        merchantId: merchant.id, merchant: merchant.name, amount, usdc,
        wallet: b.wallet || "unconnected", state: "RELEASED",
        txHash: b.txHash, blockNumber: verified.blockNumber, from: verified.from,
        explorerLink: `${CHAIN.explorer}/tx/${b.txHash}`, emailId,
      };
      const payments = readJson(PAYMENTS_FILE, []);
      payments.unshift(payment);
      writeJson(PAYMENTS_FILE, payments.slice(0, 50));
      return json(res, 200, { ok: true, payment, receiptEmail: EMAIL_TO });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
  }
  return json(res, 404, { error: "Not found" });
}

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
  console.log(`Glance Pay listening on http://0.0.0.0:${PORT} · Ethereum Sepolia USDC · on-chain verify + email receipt`);
});
