/**
 * Glance Pay — Even Hub G2 app
 *
 * Lens UI via @evenrealities/even_hub_sdk text containers.
 * Phone-side: plain HTML debug panel.
 *
 * Exports: parseVoice, ParseResult, ParseError (for test/parser.test.ts)
 */

// ─── Voice Parser (pure, exported for tests) ──────────────────────────

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

/**
 * Parse a voice transcript into an amount (and optional merchant).
 *
 * Examples: "pay 12.50" → {amount:12.5}, "pay 200 to Blue Tokai" → {amount:200, merchant:"Blue Tokai"}
 *
 * @throws {ParseError} if the phrase cannot be parsed or amount is invalid.
 */
export function parseVoice(text: string): ParseResult {
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

// ─── Types ────────────────────────────────────────────────────────────

const LensState = Object.freeze({
  IDLE: "IDLE",
  LISTENING: "LISTENING",
  PICK_MERCHANT: "PICK_MERCHANT",
  CONFIRM: "CONFIRM",
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
});

interface Merchant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  upiUri: string;
  category: string;
  aliases: string[];
}

interface AppState {
  state: string;
  amount: number | null;
  merchant: Merchant | null;
  merchantIndex: number;
  merchants: Merchant[];
  txHash: string | null;
  emailId: string | null;
  transcript: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────

const USD_RATE = 83; // INR per USDC (approximate)
const PCM_CHUNK_MS = 100;
const LISTEN_DURATION_MS = 2500;

const API_BASE = (typeof process !== "undefined" && process.env && process.env.VITE_API_BASE)
  ? String(process.env.VITE_API_BASE)
  : (typeof window !== "undefined" && window.location && window.location.origin)
    ? window.location.origin
    : "http://127.0.0.1:8787";

const LENS_CONFIG = {
  line1: { containerID: 1, y: 10, h: 80 },
  line2: { containerID: 2, y: 100, h: 80 },
  line3: { containerID: 3, y: 190, h: 80 },
};

// ─── Debug UI ─────────────────────────────────────────────────────────

function dbg(id: string, value: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function dbgState(s: AppState) {
  dbg("dbg-state", s.state);
  dbg("dbg-event", s.merchant ? `${s.merchant.name}` : "—");
  dbg("dbg-transcript", s.transcript ?? "—");
  dbg("dbg-merchant", s.merchant?.name ?? "—");
  dbg("dbg-amount", s.amount !== null ? `\u20B9${s.amount.toFixed(2)}` : "—");
  dbg("dbg-tx", s.txHash ?? "—");
  dbg("dbg-email", s.emailId ?? "—");
}

// ─── Lens text content per state ──────────────────────────────────────

function lensText(state: AppState): [string, string, string] {
  const amtStr = state.amount !== null ? `Rs ${state.amount.toFixed(2)}` : "";
  const usdcStr = state.amount !== null ? `${(state.amount / USD_RATE).toFixed(2)} USDC` : "";
  const merchantName = state.merchant?.name ?? "";

  switch (state.state) {
    case LensState.IDLE:
      return ["Glance Pay", "Ring or tap to pay", "Say an amount"];
    case LensState.LISTENING:
      return ["Listening...", "Say: pay 12.50", ""];
    case LensState.PICK_MERCHANT: {
      const items = state.merchants
        .map((m, i) => `${i === state.merchantIndex ? ">" : " "}${i + 1}. ${m.name}`)
        .join("  ");
      return ["Pick merchant", items, "Swipe - tap select"];
    }
    case LensState.CONFIRM:
      return [merchantName, `${amtStr} ~ ${usdcStr}`, "Tap to pay - ring cancel"];
    case LensState.PENDING:
      return ["Paying...", "Onchain", ""];
    case LensState.SUCCESS:
      return [`Paid ${amtStr}`, merchantName, "Receipt emailed"];
    case LensState.FAILED:
      return ["Failed", "No charge made", "Tap to retry"];
    default:
      return ["Glance Pay", "", ""];
  }
}

// ─── State ────────────────────────────────────────────────────────────

let bridge: any = null;
let pcmChunks: Uint8Array[] = [];
let audioActive = false;

const state: AppState = {
  state: LensState.IDLE,
  amount: null,
  merchant: null,
  merchantIndex: 0,
  merchants: [],
  txHash: null,
  emailId: null,
  transcript: null,
};

async function renderLens() {
  const [l1, l2, l3] = lensText(state);
  dbgState(state);
  if (!bridge) return;
  try {
    await bridge.rebuildPageContainer({
      containerTotalNum: 3,
      textObject: [
        { containerID: 1, containerName: "line1", xPosition: 0, yPosition: LENS_CONFIG.line1.y, width: 576, height: LENS_CONFIG.line1.h, isEventCapture: 1, zOrderIndex: 1, textColor: 4, content: l1 },
        { containerID: 2, containerName: "line2", xPosition: 0, yPosition: LENS_CONFIG.line2.y, width: 576, height: LENS_CONFIG.line2.h, isEventCapture: 0, zOrderIndex: 1, textColor: 4, content: l2 },
        { containerID: 3, containerName: "line3", xPosition: 0, yPosition: LENS_CONFIG.line3.y, width: 576, height: LENS_CONFIG.line3.h, isEventCapture: 0, zOrderIndex: 1, textColor: 3, content: l3 },
      ],
    });
  } catch (e) {
    console.warn("renderLens error:", e);
  }
}

async function transition(newState: string) {
  state.state = newState;
  await renderLens();
}

async function loadMerchants(): Promise<Merchant[]> {
  try {
    const res = await fetch(`${API_BASE}/api/merchants`);
    if (res.ok) {
      const data = await res.json();
      return data.merchants || [];
    }
  } catch {
    // fallback
  }
  return [
    { id: "cafe-x", name: "Caf\u00E9 X", address: "Church St, Bengaluru", lat: 12.9716, lng: 77.5946, upiUri: "upi://pay?pa=cafex@upi&pn=Cafe%20X&cu=INR", category: "cafe", aliases: ["cafe x"] },
    { id: "blue-tokai", name: "Blue Tokai", address: "Church St, Bengaluru", lat: 12.97172, lng: 77.59475, upiUri: "upi://pay?pa=bluetokai@okaxis&pn=Blue%20Tokai&cu=INR", category: "cafe", aliases: ["blue tokai"] },
  ];
}

// ─── Audio / Voice ────────────────────────────────────────────────────

async function collectPcm(): Promise<Uint8Array> {
  pcmChunks = [];
  audioActive = true;
  const startTime = Date.now();
  while (Date.now() - startTime < LISTEN_DURATION_MS) {
    await new Promise((r) => setTimeout(r, PCM_CHUNK_MS));
  }
  // Stop microphone
  audioActive = false;
  if (bridge) {
    try {
      await bridge.audioControl(false);
    } catch {
      // ignore
    }
  }
  const totalLen = pcmChunks.reduce((a, c) => a + c.length, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of pcmChunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  pcmChunks = [];
  return merged;
}

async function transcribePcm(pcm: Uint8Array): Promise<string> {
  try {
    const base64 = btoa(String.fromCharCode(...pcm));
    const res = await fetch(`${API_BASE}/api/stt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: base64, sampleRate: 16000 }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text && typeof data.text === "string" && data.text.trim()) {
        return data.text.trim();
      }
    }
  } catch {
    // fall through
  }
  return "pay 12.50";
}

async function processVoice(transcript: string): Promise<void> {
  state.transcript = transcript;
  try {
    const parsed = parseVoice(transcript);
    state.amount = parsed.amount;

    if (parsed.merchant) {
      const query = parsed.merchant.toLowerCase();
      const match = state.merchants.find(
        (m) => m.name.toLowerCase().includes(query) || m.aliases.some((a) => a.toLowerCase().includes(query))
      );
      if (match) {
        state.merchant = match;
        state.merchantIndex = state.merchants.indexOf(match);
      }
    }

    if (state.merchant) {
      await transition(LensState.CONFIRM);
    } else {
      await transition(LensState.PICK_MERCHANT);
    }
  } catch (e) {
    state.amount = null;
    state.merchant = null;
    state.transcript = `Parse error: ${(e as Error).message}`;
    await transition(LensState.IDLE);
  }
}

// ─── Payment ──────────────────────────────────────────────────────────

async function executePayment(): Promise<{ ok: boolean; txHash?: string; explorerLink?: string; emailId?: string; error?: string }> {
  if (!state.merchant || state.amount === null) {
    return { ok: false, error: "No merchant or amount selected" };
  }
  try {
    const res = await fetch(`${API_BASE}/api/demo-sign-and-pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId: state.merchant.id, amountInr: state.amount }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      state.txHash = data.txHash;
      state.emailId = data.emailId;
      return { ok: true, txHash: data.txHash, explorerLink: data.explorerLink, emailId: data.emailId };
    }
    return { ok: false, error: data.error || "Payment failed" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Event handling ───────────────────────────────────────────────────

async function handleBridgeEvent(evt: any) {
  let eventType: string | undefined;

  if (evt.textEvent) {
    const te = evt.textEvent;
    eventType = te.eventType !== undefined ? String(te.eventType) : "CLICK_EVENT";
  } else if (evt.sysEvent) {
    const se = evt.sysEvent;
    eventType = se.eventType !== undefined ? String(se.eventType) : "CLICK_EVENT";
  } else if (evt.listEvent) {
    const le = evt.listEvent;
    eventType = le.eventType !== undefined ? String(le.eventType) : "CLICK_EVENT";
  }

  const typeStr = (eventType || "").toUpperCase();

  // Double-click / Long-press → IDLE
  if (typeStr.includes("DOUBLE_CLICK") || typeStr === "3" || typeStr === "DOUBLE_CLICK_EVENT") {
    if (audioActive && bridge) { try { await bridge.audioControl(false); } catch {} }
    audioActive = false;
    state.amount = null; state.merchant = null; state.transcript = null; state.txHash = null; state.emailId = null;
    pcmChunks = [];
    await transition(LensState.IDLE);
    return;
  }

  if (typeStr.includes("LONG_PRESS") || typeStr === "9" || typeStr === "LONG_PRESS_EVENT") {
    if (audioActive && bridge) { try { await bridge.audioControl(false); } catch {} }
    audioActive = false;
    state.amount = null; state.merchant = null; state.transcript = null; state.txHash = null; state.emailId = null;
    pcmChunks = [];
    await transition(LensState.IDLE);
    return;
  }

  const isClick = typeStr.includes("CLICK") || typeStr === "0" || typeStr === "CLICK_EVENT" || eventType === undefined;

  if (isClick) {
    switch (state.state) {
      case LensState.IDLE: {
        await transition(LensState.LISTENING);
        if (bridge) {
          try {
            const sdk = await import("@evenrealities/even_hub_sdk");
            await bridge.audioControl(true, sdk.AudioInputSource.Glasses);
          } catch {
            // continue with demo
          }
        }
        const pcm = await collectPcm();
        const transcript = await transcribePcm(pcm);
        await processVoice(transcript);
        return;
      }
      case LensState.PICK_MERCHANT: {
        if (state.merchants.length > 0) {
          state.merchant = state.merchants[state.merchantIndex];
          await transition(LensState.CONFIRM);
        }
        return;
      }
      case LensState.CONFIRM: {
        await transition(LensState.PENDING);
        const result = await executePayment();
        if (state.state !== LensState.PENDING) return;
        await transition(result.ok ? LensState.SUCCESS : LensState.FAILED);
        return;
      }
      case LensState.FAILED: {
        state.txHash = null; state.emailId = null;
        await transition(LensState.CONFIRM);
        return;
      }
      case LensState.SUCCESS: {
        state.amount = null; state.merchant = null; state.txHash = null; state.emailId = null; state.transcript = null;
        await transition(LensState.IDLE);
        return;
      }
    }
    return;
  }

  const isScrollTop = typeStr.includes("SCROLL_TOP") || typeStr === "1" || typeStr === "SCROLL_TOP_EVENT";
  const isScrollBottom = typeStr.includes("SCROLL_BOTTOM") || typeStr === "2" || typeStr === "SCROLL_BOTTOM_EVENT";

  if ((isScrollTop || isScrollBottom) && state.state === LensState.PICK_MERCHANT && state.merchants.length > 1) {
    if (isScrollBottom) {
      state.merchantIndex = (state.merchantIndex + 1) % state.merchants.length;
    } else {
      state.merchantIndex = (state.merchantIndex - 1 + state.merchants.length) % state.merchants.length;
    }
    await renderLens();
  }
}

function handleAudioEvent(audioEvent: any) {
  if (audioEvent && audioEvent.audioPcm) {
    let pcm: Uint8Array;
    if (audioEvent.audioPcm instanceof Uint8Array) {
      pcm = audioEvent.audioPcm;
    } else if (Array.isArray(audioEvent.audioPcm)) {
      pcm = new Uint8Array(audioEvent.audioPcm);
    } else {
      return;
    }
    if (audioActive) {
      pcmChunks.push(pcm);
    }
  }
}

// ─── Init ─────────────────────────────────────────────────────────────

async function init() {
  // Load merchants
  state.merchants = await loadMerchants();
  if (state.merchants.length > 0 && !state.merchant) {
    state.merchant = state.merchants[0];
  }

  // Try Even Hub SDK
  try {
    const { waitForEvenAppBridge } = await import("@evenrealities/even_hub_sdk");
    bridge = await waitForEvenAppBridge();

    const l1 = "Glance Pay";
    const l2 = "Ring or tap to pay";
    const l3 = "Say an amount";
    await bridge.createStartUpPageContainer({
      containerTotalNum: 3,
      textObject: [
        { containerID: 1, containerName: "line1", xPosition: 0, yPosition: LENS_CONFIG.line1.y, width: 576, height: LENS_CONFIG.line1.h, isEventCapture: 1, zOrderIndex: 1, textColor: 4, content: l1 },
        { containerID: 2, containerName: "line2", xPosition: 0, yPosition: LENS_CONFIG.line2.y, width: 576, height: LENS_CONFIG.line2.h, isEventCapture: 0, zOrderIndex: 1, textColor: 4, content: l2 },
        { containerID: 3, containerName: "line3", xPosition: 0, yPosition: LENS_CONFIG.line3.y, width: 576, height: LENS_CONFIG.line3.h, isEventCapture: 0, zOrderIndex: 1, textColor: 3, content: l3 },
      ],
    });

    bridge.onEvenHubEvent(async (event: any) => {
      dbg("dbg-event", JSON.stringify(event).slice(0, 100));
      if (event.audioEvent) handleAudioEvent(event.audioEvent);
      if (event.textEvent || event.sysEvent || event.listEvent) {
        await handleBridgeEvent(event);
      }
    });
  } catch (err) {
    console.warn("Even Hub SDK not available — phone-side debug mode only:", err);
  }

  // Wire phone-side buttons
  document.getElementById("btn-reset")?.addEventListener("click", async () => {
    if (audioActive && bridge) { try { await bridge.audioControl(false); } catch {} }
    audioActive = false;
    state.amount = null; state.merchant = null; state.txHash = null; state.emailId = null; state.transcript = null;
    pcmChunks = [];
    await transition(LensState.IDLE);
  });

  document.getElementById("btn-demo-voice")?.addEventListener("click", async () => {
    await transition(LensState.LISTENING);
    await new Promise((r) => setTimeout(r, 1500));
    await processVoice("pay 12.50");
  });

  document.getElementById("btn-approve")?.addEventListener("click", async () => {
    if (state.state === LensState.CONFIRM || state.state === LensState.PICK_MERCHANT) {
      if (!state.merchant && state.merchants.length > 0) state.merchant = state.merchants[state.merchantIndex];
      if (!state.amount) state.amount = 12.5;
      await transition(LensState.PENDING);
      const result = await executePayment();
      if (state.state !== LensState.PENDING) return;
      await transition(result.ok ? LensState.SUCCESS : LensState.FAILED);
    } else if (state.state === LensState.IDLE || state.state === LensState.LISTENING) {
      state.amount = 12.5;
      state.merchant = state.merchants[0] || null;
      await transition(LensState.CONFIRM);
    }
  });

  dbgState(state);
  renderLens();
}

// Boot
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}