const $ = (id) => document.getElementById(id);
const api = async (path, options) => {
  const r = await fetch(path, options);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
};
const lens = (a, b, c, state) => {
  $("l1").textContent = String(a).slice(0, 22);
  $("l2").textContent = String(b).slice(0, 22);
  $("l3").textContent = String(c).slice(0, 22);
  if (state) $("lens-state").textContent = state;
};
const status = (html, kind = "") => { $("status").innerHTML = html; $("status").className = `status ${kind}`; };
let wallet = localStorage.getItem("gp-wallet") || null;
let merchants = [];

function renderWallet() {
  $("wallet").textContent = wallet ? `Connected: ${wallet} (capped demo wallet)` : "Not connected";
  $("connect").textContent = wallet ? "Wallet connected" : "Connect wallet";
  $("connect").disabled = !!wallet;
}
function renderMerchants() {
  $("merchant").innerHTML = merchants.map((m) => `<option value="${m.id}">${m.name} — ${m.category}</option>`).join("");
  $("admin-merchants").innerHTML = merchants.map((m) =>
    `<div><b>${m.name}</b> · ${m.address} · ${m.upiUri}</div>`).join("");
}
function renderPayments(list, target) {
  $(target).innerHTML = list.length ? list.map((p) =>
    `<div><b>${p.merchant}</b> · ₹${p.amount.toFixed(2)} · ${p.state} · ${new Date(p.time).toLocaleString()}` +
    `${p.emailId ? `<br>Receipt email id: ${p.emailId}` : ""}</div>`).join("") : "No payments yet.";
}
async function refreshPayments() {
  const { payments } = await api("/api/payments");
  renderPayments(payments, "admin-payments");
  renderPayments(payments.filter((p) => !wallet || p.wallet === wallet), "payments");
}

$("connect").addEventListener("click", () => {
  wallet = "0x" + Math.random().toString(16).slice(2, 10) + "…cafe";
  localStorage.setItem("gp-wallet", wallet);
  renderWallet();
  status("Wallet connected. Pick a merchant and press <b>Pay with Glance</b>.");
  lens("Wallet ready", "Capped session wallet", "Choose a merchant", "IDLE");
});

$("pay").addEventListener("click", async () => {
  const merchant = merchants.find((m) => m.id === $("merchant").value);
  const amount = Number($("amount").value);
  if (!merchant) return status("Please onboard a merchant first (Admin tab).", "err");
  if (!(amount > 0 && amount <= 500)) return status("Amount must be between ₹0 and ₹500.", "err");
  $("pay").disabled = true;
  try {
    lens(merchant.name, `₹${amount.toFixed(2)}`, "confirm on lens", "CONFIRM");
    status("Quote created. Signing…", "");
    await new Promise((r) => setTimeout(r, 350));
    lens("Paying…", "Via RupeeRail", "mock payout", "PENDING");
    const res = await api("/api/pay", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId: merchant.id, amount, wallet }),
    });
    lens(`Paid ₹${amount.toFixed(2)}`, `to ${merchant.name}`, "receipt emailed", "SUCCESS");
    status(`<b>Paid ₹${amount.toFixed(2)} to ${merchant.name}.</b><br>A receipt email was sent to ${res.receiptEmail}. ` +
      `Email id: ${res.payment.emailId} · tx ${res.payment.txHash}`, "ok");
    await refreshPayments();
  } catch (e) {
    lens("Payment failed", "No money moved", "try again", "FAILED");
    status(`Payment failed: ${e.message}`, "err");
  } finally {
    $("pay").disabled = false;
  }
});

$("onboard-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await api("/api/merchants", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: $("m-name").value, address: $("m-address").value,
        lat: $("m-lat").value, lng: $("m-lng").value,
        upiUri: $("m-upi").value, category: $("m-category").value,
      }),
    });
    $("onboard-status").textContent = `Onboarded ${res.merchant.name}.`;
    $("onboard-form").reset();
    await loadMerchants();
  } catch (err) { $("onboard-status").textContent = err.message; }
});

$("tab-user").addEventListener("click", () => {
  $("user-view").hidden = false; $("admin-view").hidden = true;
  $("tab-user").classList.add("active"); $("tab-admin").classList.remove("active");
});
$("tab-admin").addEventListener("click", () => {
  $("user-view").hidden = true; $("admin-view").hidden = false;
  $("tab-admin").classList.add("active"); $("tab-user").classList.remove("active");
  refreshPayments();
});

async function loadMerchants() {
  const data = await api("/api/merchants");
  merchants = data.merchants;
  renderMerchants();
}

(async () => {
  try {
    const health = await api("/api/health");
    $("provider-badge").textContent = `payout: ${health.provider}`;
    await loadMerchants();
    renderWallet();
    await refreshPayments();
  } catch (e) {
    status(`Cannot reach the demo API: ${e.message}`, "err");
  }
})();
