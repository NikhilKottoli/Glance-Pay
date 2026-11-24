/**
 * Word-to-number conversion utilities for voice parsing.
 */

const WORDS: Record<string, number> = {
  zero: 0, oh: 0,
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

export function wordToNumber(word: string): number | null {
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

export function wordsToNumber(tokens: string[]): number | null {
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
  if (tokens.length === 0) return null;
  return total;
}