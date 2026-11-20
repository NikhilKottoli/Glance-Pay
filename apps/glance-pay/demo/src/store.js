// Pure helpers for merchant onboarding and local-only payment history.
const UPI_RE = /^upi:\/\/pay\?pa=[^&\s]+/;

export function makeMerchantId(name) {
  const slug = String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "merchant";
  return `${slug}-${Date.now().toString(36).slice(-5)}`;
}

export function validateMerchantInput(input) {
  const name = (input.name || "").trim();
  const address = (input.address || "").trim();
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  const upiUri = (input.upiUri || "").trim();
  const category = (input.category || "cafe").trim();
  const aliases = String(input.aliases || "").split(",").map((a) => a.trim().toLowerCase()).filter(Boolean);

  if (!name) return { error: "Merchant name is required." };
  if (!address) return { error: "Address is required." };
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return { error: "Latitude is invalid." };
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return { error: "Longitude is invalid." };
  if (!UPI_RE.test(upiUri)) return { error: "UPI URI must start with upi://pay?pa=<vpa>." };

  return {
    merchant: {
      id: makeMerchantId(name), name, address, lat, lng, upiUri, category,
      aliases: [name.toLowerCase(), ...aliases],
    },
  };
}

export function mergeMerchants(seed, added) {
  const seen = new Set(seed.map((m) => m.id));
  return [...seed, ...added.filter((m) => !seen.has(m.id))];
}

export function paymentRecord({ merchant, amount, usdc, state, tx, wallet }) {
  return {
    id: `pay-${Date.now().toString(36)}`,
    time: new Date().toISOString(),
    merchant: merchant || "unknown",
    amount: Number(amount),
    usdc: usdc || null,
    state,
    tx: tx || null,
    wallet: wallet || "unconnected",
  };
}
