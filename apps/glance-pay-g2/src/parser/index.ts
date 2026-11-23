/**
 * Voice parser for Glance Pay G2 app.
 * Parses voice transcripts into amount and optional merchant.
 */

// Inlined from shared/types.ts
export interface ParseResult {
  amount: number;
  merchant?: string;
}

export class ParseError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ParseError";
  }
}

// Inlined from shared/constants.ts
const USD_RATE = 83; // INR per USDC (approximate)
const MAX_AMOUNT_INR = 500;

// Inlined from parser/words.ts
const WORDS: Record<string, number> = {
  zero: 0, oh: 0,
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

function wordToNumber(word: string): number | null {
  const w = word.toLowerCase().replace(/[,\.]$/, "").replace(/^[,\.]/, "");
  if (w.includes("-")) {
    const parts = w.split("-");
    const a = WORDS[parts[0]];
    const b = WORDS[parts[1]];
    if (a !== undefined && b !== undefined) return a + b;
    return null;
  }
  if (WORDS[w] !== undefined) return WORDS[w];
  return null;
}

function wordsToNumber(tokens: string[]): number | null {
  const joined = tokens.join(" ");
  const direct = parseFloat(joined);
  if (Number.isFinite(direct)) return direct;

  // Try vernacular pattern: "twelve fifty" → 12.5, "one fifty" → 1.5
  // Two numbers where second is ≤99 → fractional dollars
  if (tokens.length === 2) {
    const a = wordToNumber(tokens[0]);
    const b = wordToNumber(tokens[1]);
    if (a !== null && b !== null && b <= 99) {
      // "twelve fifty" → 12.5
      if (a >= b) return a + b;
      return a + b / 100;
    }
  }

  // Proper English number parsing: "one hundred fifty" → 150
  const MULTIPLIERS: Record<string, number> = {
    hundred: 100,
    thousand: 1000,
    lakh: 100000,
    million: 1000000,
  };

  let total = 0;
  let current = 0;

  for (const token of tokens) {
    const n = wordToNumber(token);
    const m = MULTIPLIERS[token.toLowerCase()];

    if (n !== null) {
      current += n;
    } else if (m !== undefined) {
      if (current === 0) current = 1; // "hundred" alone = 100
      total += current * m;
      current = 0;
    } else {
      return null;
    }
  }

  total += current;
  return total;
}

/**
 * Parse a voice transcript into an amount (and optional merchant).
 *
 * Examples: "pay 12.50" → {amount:12.5}, "pay 200 to Blue Tokai" → {amount:200, merchant:"Blue Tokai"}
 *
 * @throws {ParseError} if the phrase cannot be parsed or amount is invalid.
 */
export function parseVoice(text: string): { amount: number; merchant?: string } {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) throw new ParseError("Empty phrase");
  const lower = cleaned.toLowerCase();
  if (!lower.startsWith("pay ")) throw new ParseError('Phrase must start with "pay"');

  const afterPay = cleaned.slice(4).trim();
  if (!afterPay) throw new ParseError("No amount specified after 'pay'");

  let merchant: string | undefined;
  let amountPart = afterPay;

  const toMatch = afterPay.match(/^(.*?)\s+to\s+(.+)$/i);
  if (toMatch) {
    amountPart = toMatch[1].trim();
    const merchantName = toMatch[2].trim();
    if (merchantName) merchant = merchantName.replace(/\s+/g, " ").trim();
  }

  const unitMatch = amountPart.match(/^(.+?)\s+(rupees?|rupiah|inr|rs|usdc|dollars?|usd)$/i);
  if (unitMatch) amountPart = unitMatch[1].trim();

  const tokens = amountPart.split(/\s+/);
  let amount: number | null = null;

  const fullNum = parseFloat(amountPart);
  if (Number.isFinite(fullNum)) {
    amount = fullNum;
  } else {
    amount = wordsToNumber(tokens);
  }

  if (amount === null || !Number.isFinite(amount)) {
    throw new ParseError(`Could not parse amount from "${amountPart}"`);
  }
  if (amount <= 0) throw new ParseError("Amount must be positive");
  if (amount > 500) throw new ParseError("Amount exceeds 500 limit");

  return { amount, merchant };
}

// Re-export for tests
// ParseError is already exported above