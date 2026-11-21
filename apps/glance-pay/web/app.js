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
const done = (n) => $(`step-${n}`).classList.add("done");
const pad32 = (hex) => String(hex).replace(/^0x/, "").padStart(64, "0");
const units = (inr) => BigInt(Math.round((Number(inr) * 1_000_000) / 83)); // same formula as backend

let cfg = null;
let account = null;
let merchants = [];

function short(addr) { return addr ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : "—"; }

async function switchToChain() {
  const chainIdHex = "0x" + cfg.chainId.toString(16);
  try {
    await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
  } catch (e) {
    if (e.code !== 4902) throw e;
    await ethereum.request({ method: "wallet_addEthereumChain", params: [{
      chainId: chainIdHex, chainName: cfg.chainName,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: [cfg.rpcUrl], blockExplorerUrls: [cfg.explorer],
    }] });
  }
}

async function refreshBalances() {
  if (!account) return;
  const ethHex = await ethereum.request({ method: "eth_getBalance", params: [account, "latest"] });
  const usdcHex = await ethereum.request({ method: "eth_call",
    params: [{ to: cfg.usdc, data: "0x70a08231" + pad32(account) }, "latest"] });
  $("eth-balance").textContent = (Number(BigInt(ethHex)) / 1e18).toFixed(5);
  $("usdc-balance").textContent = (Number(BigInt(usdcHex)) / 1e6).toFixed(4);
}

$("connect").addEventListener("click", async () => {
  try {
    if (!window.ethereum) throw new Error("No browser wallet found. Install MetaMask, then reload.");
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    const chainId = await ethereum.request({ method: "eth_chainId" });
    if (parseInt(chainId, 16) !== cfg.chainId) await switchToChain();
    $("wallet").textContent = `Connected: ${short(account)}`;
    $("connect").textContent = "Wallet connected";
    $("connect").disabled = true;
    done("connect");
    await refreshBalances();
    done("fund");
    lens("Wallet ready", short(account), "pick a merchant", "IDLE");
    status("Wallet connected on Ethereum Sepolia. Use the faucet links if balances are zero, then press <b>Sign transaction &amp; pay</b>.");
    await refreshPayments();
  } catch (e) {
    status(`Wallet connection failed: ${e.message}`, "err");
  }
});

$("refresh-balance").addEventListener("click", async () => {
  try { await refreshBalances(); done("fund"); }
  catch (e) { status(`Balance check failed: ${e.message}`, "err"); }
});

function previewSelection() {
  const m = merchants.find((x) => x.id === $("merchant").value);
  const amount = Number($("amount").value);
  if (amount > 0) $("usdc-amount").value = `≈ ${(amount / 83).toFixed(4)} USDC`;
  if (m && amount > 0) lens(m.name, `₹${amount.toFixed(2)}`, "confirm on lens", "CONFIRM");
}
$("merchant").addEventListener("change", previewSelection);
$("amount").addEventListener("input", previewSelection);

$("pay").addEventListener("click", async () => {
  const merchant = merchants.find((m) => m.id === $("merchant").value);
  const amount = Number($("amount").value);
  if (!account) return status("Connect your wallet first.", "err");
  if (!merchant) return status("Select a merchant first.", "err");
  if (!(amount > 0 && amount <= 500)) return status("Amount must be between ₹0 and ₹500.", "err");
  $("pay").disabled = true;
  try {
    const value = units(amount);
    const data = "0xa9059cbb" + pad32(cfg.treasury) + value.toString(16).padStart(64, "0");
    lens("Sign in wallet", `${(amount / 83).toFixed(4)} USDC`, "approve the tx", "SIGNING");
    status("Waiting for your wallet signature…");
    const txHash = await ethereum.request({ method: "eth_sendTransaction",
      params: [{ from: account, to: cfg.usdc, data }] });
    done("sign");
    lens("Signed", "Submitted onchain", "verifying…", "PENDING");
    status("Transaction submitted. Backend is verifying the on-chain receipt…");
    const res = await api("/api/pay", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId: merchant.id, amount, wallet: account, txHash }),
    });
    done("receipt");
    lens(`Paid ₹${amount.toFixed(2)}`, `to ${merchant.name}`, "receipt emailed", "SUCCESS");
    status(`<b>Payment verified on Ethereum Sepolia.</b><br>Receipt emailed to ${res.receiptEmail} · email id ${res.payment.emailId}<br>` +
      `<a href="${res.payment.explorerLink}" target="_blank" rel="noopener">View transaction ${short(txHash)} ↗</a>`, "ok");
    await refreshBalances();
    await refreshPayments();
  } catch (e) {
    lens("Payment failed", "No charge made", "see message", "FAILED");
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

function renderMerchants() {
  $("merchant").innerHTML = merchants.map((m) => `<option value="${m.id}">${m.name} — ${m.category}</option>`).join("");
  $("admin-merchants").innerHTML = merchants.map((m) =>
    `<div><b>${m.name}</b> · ${m.address} · ${m.upiUri}</div>`).join("");
  previewSelection();
}
function renderPayments(list, target) {
  $(target).innerHTML = list.length ? list.map((p) =>
    `<div><b>${p.merchant}</b> · ₹${p.amount.toFixed(2)} · ${p.usdc} USDC · ${p.state}` +
    `${p.explorerLink ? ` · <a href="${p.explorerLink}" target="_blank" rel="noopener">tx ↗</a>` : ""}` +
    `${p.emailId ? `<br>Receipt email id: ${p.emailId}` : ""}</div>`).join("") : "No payments yet.";
}
async function refreshPayments() {
  const { payments } = await api("/api/payments");
  renderPayments(payments, "admin-payments");
  renderPayments(payments.filter((p) => !account || p.wallet === account), "payments");
}
async function loadMerchants() {
  merchants = (await api("/api/merchants")).merchants;
  renderMerchants();
}

(async () => {
  try {
    cfg = await api("/api/chain");
    $("chain-badge").textContent = `${cfg.chainName} · ${cfg.chainId}`;
    await loadMerchants();
    await refreshPayments();
  } catch (e) {
    status(`Cannot reach backend: ${e.message}`, "err");
  }
})();
