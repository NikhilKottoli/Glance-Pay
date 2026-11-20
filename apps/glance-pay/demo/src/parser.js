// Pure voice -> { amount, currency?, merchantHint? } parser. No side effects.
export const DEFAULT_MAX_AMOUNT = 500;

const SMALL = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

function wordsToAmount(words) {
  if (words.length === 0) return null;
  // Indian-English colloquial: "twelve fifty" == 12.50
  if (words.length === 2 && SMALL[words[0]] >= 10 && SMALL[words[0]] < 20 &&
      SMALL[words[1]] >= 10 && SMALL[words[1]] < 100) {
    return SMALL[words[0]] + SMALL[words[1]] / 100;
  }
  let total = 0;
  let current = 0;
  let used = false;
  for (const w of words) {
    if (w === "hundred") {
      current = (current || 1) * 100;
      used = true;
      continue;
    }
    if (!(w in SMALL)) return null;
    current += SMALL[w];
    used = true;
  }
  return used ? total + current : null;
}

export function parseVoice(input, maxAmount = DEFAULT_MAX_AMOUNT) {
  if (typeof input !== "string" || !input.trim()) {
    return { error: "No amount heard. Try 'pay 12.50'." };
  }
  let text = input.toLowerCase().replace(/[₹$#,!?]/g, " ").replace(/\s+/g, " ").trim();
  if (!/\bpay\b/.test(text)) return { error: "Say 'pay' followed by an amount." };
  if (/-\s*\d|minus\b/.test(text)) return { error: "Amount must be greater than zero." };

  let merchantHint = null;
  const toIdx = text.indexOf(" to ");
  if (toIdx !== -1) {
    merchantHint = text.slice(toIdx + 4).trim().split(/\s+(?:rupees?|inr)\b/)[0].trim() || null;
    text = text.slice(0, toIdx);
  }

  const numeric = text.match(/\d+(?:\.\d{1,2})?/);
  let amount;
  if (numeric) {
    amount = Number(numeric[0]);
  } else {
    const words = text.split(" ").filter((w) => w && w !== "pay" && w !== "rupees" &&
      w !== "rupee" && w !== "inr" && w !== "rs" && w !== "please" && w !== "the");
    amount = wordsToAmount(words);
  }
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return { error: "Could not understand the amount." };
  }
  if (amount <= 0) return { error: "Amount must be greater than zero." };
  if (amount > maxAmount) return { error: `Amount over the ₹${maxAmount} demo limit.` };

  const currency = /\b(rupees?|rs|inr)\b/.test(text) ? "INR" : undefined;
  const result = { amount: Math.round(amount * 100) / 100 };
  if (currency) result.currency = currency;
  if (merchantHint) result.merchantHint = merchantHint;
  return result;
}
