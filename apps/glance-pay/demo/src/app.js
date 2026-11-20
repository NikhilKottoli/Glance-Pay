import { StateMachine } from "./state-machine.js";
import { parseVoice } from "./parser.js";
import { loadMerchants, rankMerchants, shortUpi } from "./merchants.js";
import { ROLE, assertCan } from "./roles.js";
import { validateMerchantInput, mergeMerchants, paymentRecord } from "./store.js";

const $ = (id) => document.getElementById(id);
const KEYS = { merchants: "glance-pay-merchants", payments: "glance-pay-payments", wallet: "glance-pay-wallet" };
const GPS = {
  pair: { lat: 12.97164, lng: 77.59466 },   // Café X / Blue Tokai ~15 m apart
  single: { lat: 12.9719, lng: 77.5951 },   // Chai Point
  far: { lat: 13.0, lng: 77.7 },             // nothing nearby
};

let sm, seedMerchants, merchants, parsed, candidates, selected, cursor, quote;
let confirmLock, spent, audit, timers = [], quoteTimer = null;
let role = ROLE.USER;
let wallet = localStorage.getItem(KEYS.wallet) || null;

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const fit = (s) => String(s ?? "").slice(0, 22);
const money = (n) => `₹${Number(n).toFixed(2)}`;

function later(fn, ms) {
  const id = setTimeout(() => { timers = timers.filter((t) => t !== id); fn(); }, ms);
  timers.push(id);
  return id;
}
function stopTimers() {
  timers.forEach(clearTimeout);
  timers = [];
  if (quoteTimer) clearInterval(quoteTimer);
  quoteTimer = null;
}
function setLens(a, b, c) {
  $("l1").textContent = fit(a);
  $("l2").textContent = fit(b);
  $("l3").textContent = fit(c);
}
function logAudit(state, detail, tx) {
  audit.unshift({ time: new Date().toLocaleTimeString("en-GB"), state, detail, tx });
  renderDebug();
}
function renderDebug() {
  $("phone-state").textContent = sm.state;
  $("lens-state").textContent = sm.state;
  $("budget").textContent = `Remaining: ${money(500 - spent)} / ₹500.00 · spent ${money(spent)}`;

  if (parsed) {
    $("ctx").innerHTML = `Amount <b>${money(parsed.amount)}</b>${parsed.currency ? " " + parsed.currency : ""}`
      + `${parsed.hint ? ` · hint "${fit(parsed.hint)}"` : ""}`
      + `${selected ? `<br>Merchant <b>${fit(selected.merchant.name)}</b> · ${shortUpi(selected.merchant.upiUri)}` : ""}`;
  } else {
    $("ctx").textContent = "Awaiting start gesture.";
  }
  $("quote-info").textContent = quote
    ? `Quote: ${money(parsed.amount)} ≈ ${quote.usdc} USDC · expires ${new Date(quote.expires).toLocaleTimeString("en-GB")}`
    : "Quote: —";

  $("merchant-list").innerHTML = candidates.length
    ? candidates.map((c, i) => `<div class="${sm.state === "PICK_MERCHANT" && i === cursor ? "sel" : ""}">`
        + `${i + 1}. ${fit(c.merchant.name)} · ${c.distance} m · score ${c.score}</div>`).join("")
    : "—";

  $("audit-list").innerHTML = audit.length
    ? audit.slice(0, 5).map((a) => `<div><b>${a.time}</b> ${a.state} · ${fit(a.detail)}${a.tx ? ` · ${a.tx}` : ""}</div>`).join("")
    : "No attempts yet.";
}

function renderWallet() {
  $("wallet-status").textContent = wallet
    ? `Connected: ${wallet} · capped demo session wallet`
    : "Not connected. Connect a low-balance demo wallet to view your payments.";
  $("btn-connect-wallet").textContent = wallet ? "Wallet connected" : "Connect wallet";
  $("btn-connect-wallet").disabled = !!wallet;
}

function renderPayments() {
  const list = readStore(KEYS.payments, []);
  if (!wallet) {
    $("payments-list").textContent = "Connect your wallet to see payment history.";
    return;
  }
  $("payments-list").innerHTML = list.length
    ? list.map((p) => `<div><b>${p.merchant}</b> · ${money(p.amount)}${p.usdc ? ` ≈ ${p.usdc} USDC` : ""}`
        + ` · ${p.state} · ${new Date(p.time).toLocaleString("en-GB")}${p.tx ? ` · ${p.tx}` : ""}</div>`).join("")
    : "No payments yet for this wallet.";
}

function renderOnboarded() {
  const added = readStore(KEYS.merchants, []);
  $("onboarded-list").innerHTML = added.length
    ? added.map((m) => `<div>${fit(m.name)} · ${m.lat}, ${m.lng} · ${shortUpi(m.upiUri)}</div>`).join("")
    : "No merchants onboarded in this session yet.";
}

function setRole(next) {
  if (![ROLE.USER, ROLE.ADMIN].includes(next)) return;
  role = next;
  $("role-user").classList.toggle("active", role === ROLE.USER);
  $("role-admin").classList.toggle("active", role === ROLE.ADMIN);
  $("user-tools").hidden = role !== ROLE.USER;
  $("admin-tools").hidden = role !== ROLE.ADMIN;
  $("role-label").textContent = role.toUpperCase();
  if (role === ROLE.USER) {
    stopTimers();
    reset();
    renderWallet();
    renderPayments();
  } else {
    renderOnboarded();
  }
}

function connectWallet() {
  assertCan(role, "wallet:connect");
  if (!wallet) {
    wallet = "0x" + Math.random().toString(16).slice(2, 10) + "…cafe";
    localStorage.setItem(KEYS.wallet, wallet);
  }
  renderWallet();
  renderPayments();
}

function onboardMerchant(event) {
  event.preventDefault();
  assertCan(role, "merchant:onboard");
  const result = validateMerchantInput({
    name: $("m-name").value, address: $("m-address").value,
    lat: $("m-lat").value, lng: $("m-lng").value,
    upiUri: $("m-upi").value, category: $("m-category").value,
    aliases: $("m-aliases").value,
  });
  if (result.error) {
    $("onboard-status").textContent = result.error;
    return;
  }
  const added = readStore(KEYS.merchants, []);
  added.push(result.merchant);
  writeStore(KEYS.merchants, added);
  merchants = mergeMerchants(seedMerchants, added);
  $("onboard-status").textContent = `Onboarded ${result.merchant.name} (${result.merchant.id}).`;
  $("onboard-form").reset();
  $("m-category").value = "cafe";
  renderOnboarded();
}

function recordPayment(state, tx) {
  const history = readStore(KEYS.payments, []);
  history.unshift(paymentRecord({
    merchant: selected ? selected.merchant.name : "unknown",
    amount: parsed.amount, usdc: quote?.usdc, state, tx, wallet,
  }));
  writeStore(KEYS.payments, history.slice(0, 20));
}

function reset() {
  stopTimers();
  sm = new StateMachine();
  parsed = null; candidates = []; selected = null; cursor = 0; quote = null;
  confirmLock = false; spent = 0; audit = [];
  setLens("Glance Pay", "Ready · tap to start", "Tap to start listening");
  renderDebug();
}

function startListening() {
  if (sm.state !== "IDLE") return;
  sm.transition("LISTENING");
  setLens("Listening…", "Say: pay 12.50", "Or type a phrase → Speak");
  logAudit("LISTENING", "start gesture");
}

function speak() {
  if (sm.state !== "LISTENING") {
    setLens("Start first", "Tap start gesture", "");
    return;
  }
  const result = parseVoice($("voice-input").value);
  if (result.error) {
    setLens("Not understood", result.error, "Try again");
    return;
  }
  parsed = result;
  parsed.hint = result.merchantHint || ($("wrong-hint").checked ? "Unknown Shop" : null);
  sm.transition("AMOUNT_HEARD");
  setLens("Heard " + money(result.amount), parsed.hint ? `for ${parsed.hint}` : "to nearby merchant", "Resolving…");
  logAudit("AMOUNT_HEARD", `parsed ${money(result.amount)}`);
  later(resolveMerchant, 800);
}

function resolveMerchant() {
  sm.transition("RESOLVING");
  const accuracy = Number($("accuracy").value);
  candidates = rankMerchants(merchants, GPS[$("gps-select").value], parsed.hint, accuracy);
  if (!candidates.length) {
    sm.transition("FAILED");
    setLens("No merchant nearby", "Nothing charged", "Try another position");
    logAudit("FAILED", "no merchant in radius");
    return;
  }
  const dominant = candidates.length === 1 ||
    (parsed.hint && candidates[0].score - (candidates[1]?.score ?? -999) > 60);
  if (dominant) {
    selected = candidates[0];
    enterConfirm();
    return;
  }
  cursor = 0;
  sm.transition("PICK_MERCHANT");
  showPick();
  logAudit("PICK_MERCHANT", `${candidates.length} candidates`);
}

function showPick() {
  setLens("Pick merchant", candidates[cursor].merchant.name, "Ring: next · Tap: pick");
  renderDebug();
}

function nextCandidate() {
  if (sm.state !== "PICK_MERCHANT") return;
  cursor = (cursor + 1) % candidates.length;
  showPick();
}

function enterConfirm() {
  sm.transition("CONFIRM");
  quote = { expires: Date.now() + 30000, usdc: (parsed.amount / 83).toFixed(2) };
  confirmLock = false;
  renderConfirm();
  logAudit("CONFIRM", `quote for ${selected.merchant.id}`);
  quoteTimer = setInterval(tickQuote, 1000);
}

function renderConfirm() {
  setLens(selected.merchant.name, `${money(parsed.amount)} ≈ ${quote.usdc} USDC`,
    `TAP pay · ${remaining()}s · RING cancel`);
  renderDebug();
}
function remaining() {
  return Math.max(0, Math.ceil((quote.expires - Date.now()) / 1000));
}
function tickQuote() {
  if (sm.state !== "CONFIRM") return;
  if (remaining() <= 0) {
    clearInterval(quoteTimer); quoteTimer = null;
    sm.transition("TIMEOUT");
    setLens("Timed out", "No charge made", "Back to IDLE");
    logAudit("TIMEOUT", "confirm countdown expired");
    later(reset, 2600);
    return;
  }
  renderConfirm();
}

function confirmTap() {
  if (sm.state === "PICK_MERCHANT") {
    selected = candidates[cursor];
    enterConfirm();
    return;
  }
  if (sm.state !== "CONFIRM") return;
  if (confirmLock) {
    logAudit("CONFIRM", "duplicate tap ignored (idempotency)");
    return;
  }
  if (Date.now() >= quote.expires) {
    clearInterval(quoteTimer); quoteTimer = null;
    sm.transition("RESOLVING");
    setLens("Quote expired", "Re-quoting…", "Confirm again");
    logAudit("RESOLVING", "stale quote → re-quote");
    later(enterConfirm, 700);
    return;
  }
  confirmLock = true;
  clearInterval(quoteTimer); quoteTimer = null;
  sm.transition("SIGNING");
  setLens("Signing intent…", "EIP-712 + permit", "Capped session wallet");
  logAudit("SIGNING", "intent signed");
  later(() => {
    sm.transition("PENDING");
    setLens("Paying…", "Via RupeeRail", "Escrow → UPI payout");
    logAudit("PENDING", "submitted to rail");
    later(finish, 1100);
  }, 750);
}

function finish() {
  const tx = "0x" + Math.random().toString(16).slice(2, 10);
  if ($("fail-toggle").checked) {
    sm.transition("FAILED");
    setLens("Failed, refunded", `${money(parsed.amount)} returned`, "No money lost");
    logAudit("FAILED", "payout failed → refund", tx);
    recordPayment("FAILED", tx);
    return;
  }
  sm.transition("SUCCESS");
  spent += parsed.amount;
  setLens(`Paid ${money(parsed.amount)}`, `to ${selected.merchant.name}`, "Receipt on phone");
  logAudit("SUCCESS", `paid ${selected.merchant.id}`, tx);
  recordPayment("SUCCESS", tx);
}

function cancel() {
  if (!["LISTENING", "AMOUNT_HEARD", "PICK_MERCHANT", "CONFIRM"].includes(sm.state)) return;
  clearInterval(quoteTimer); quoteTimer = null;
  sm.transition("CANCELLED");
  setLens("Cancelled", "Nothing charged", "Tap to restart");
  logAudit("CANCELLED", "user cancel gesture");
}

function timeout() {
  if (!["LISTENING", "AMOUNT_HEARD", "PICK_MERCHANT", "CONFIRM"].includes(sm.state)) return;
  clearInterval(quoteTimer); quoteTimer = null;
  sm.transition("TIMEOUT");
  setLens("Timed out", "No charge made", "Back to IDLE");
  logAudit("TIMEOUT", "forced timeout");
  later(reset, 2600);
}

function guarded(permission, fn) {
  return (...args) => {
    try { assertCan(role, permission); fn(...args); }
    catch (e) { $("onboard-status").textContent = e.message; }
  };
}

function bind() {
  $("role-user").addEventListener("click", () => setRole(ROLE.USER));
  $("role-admin").addEventListener("click", () => setRole(ROLE.ADMIN));
  $("btn-connect-wallet").addEventListener("click", guarded("wallet:connect", connectWallet));
  $("onboard-form").addEventListener("submit", guarded("merchant:onboard", onboardMerchant));
  const simulate = (fn) => guarded("payment:simulate", fn);
  $("btn-start").addEventListener("click", simulate(startListening));
  $("btn-speak").addEventListener("click", simulate(speak));
  $("btn-confirm").addEventListener("click", simulate(confirmTap));
  $("btn-next").addEventListener("click", simulate(nextCandidate));
  $("btn-cancel").addEventListener("click", simulate(cancel));
  $("btn-timeout").addEventListener("click", simulate(timeout));
  $("btn-reset").addEventListener("click", simulate(reset));
  $("accuracy").addEventListener("input", () => { $("accuracy-val").textContent = $("accuracy").value + " m"; });
}

async function init() {
  const data = await (await fetch("./data/merchants.json")).json();
  seedMerchants = loadMerchants(data);
  merchants = mergeMerchants(seedMerchants, readStore(KEYS.merchants, []));
  bind();
  setRole(ROLE.USER);
  renderWallet();
  renderPayments();
}
init().catch((e) => { setLens("Demo error", String(e).slice(0, 22), "Check console"); });
