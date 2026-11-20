// Seeded merchant registry loader + accuracy-aware ranking. Runs on-device.
export function loadMerchants(data) {
  if (!Array.isArray(data)) throw new Error("Merchant registry must be an array");
  for (const m of data) {
    for (const key of ["id", "name", "address", "lat", "lng", "upiUri", "category", "aliases"]) {
      if (!(key in m)) throw new Error(`Merchant ${m.id || "?"} missing ${key}`);
    }
    if (!/^upi:\/\/pay\?pa=[^&\s]+/.test(m.upiUri)) {
      throw new Error(`Merchant ${m.id} has invalid upiUri`);
    }
  }
  return data;
}

export function distanceMeters(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function similarity(hint, text) {
  const a = hint.toLowerCase();
  const b = text.toLowerCase();
  if (b.includes(a)) return 1;
  // cheap bigram overlap for fuzzy matches
  const grams = new Set(a.match(/../g) || [a]);
  let hit = 0;
  for (const g of grams) if (b.includes(g)) hit += 1;
  return hit / grams.size;
}

export function rankMerchants(merchants, gps, hint = null, accuracy = 20) {
  const radius = hint ? 2000 : 300;
  const scored = merchants.map((m) => {
    const distance = distanceMeters(gps, m);
    const nameScore = hint ? similarity(hint, m.name) : 0;
    const aliasScore = hint ? Math.max(0, ...m.aliases.map((x) => similarity(hint, x))) : 0;
    const hintBonus = 100 * Math.max(nameScore, aliasScore);
    const distancePenalty = distance / Math.max(5, accuracy);
    return { merchant: m, distance: Math.round(distance), score: Math.round(hintBonus - distancePenalty) };
  });
  return scored
    .filter((s) => (hint ? s.distance <= radius : s.distance <= radius))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function shortUpi(uri) {
  const pa = new URLSearchParams(uri.split("?")[1] || "").get("pa") || "";
  return pa.length > 18 ? `${pa.slice(0, 15)}…` : pa;
}
