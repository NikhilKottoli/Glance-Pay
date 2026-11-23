/**
 * Voice processing for Glance Pay G2 app.
 */

import { state, LensState, loadLastPayment, saveLastPayment, loadMerchants } from "../state";
import { parseVoice } from "../parser";
import { executePayment } from "../utils/api";
import { transition } from "../lens";
import { loadLastPayment as loadLastPaymentUtil, saveLastPayment as saveLastPaymentUtil } from "../state";

export async function processVoice(transcript: string) {
  const { parseVoice } = await import("../parser");
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

    // Smart default: if no merchant was spoken, reuse the last paid merchant
    if (!state.merchant) {
      const last = loadLastPayment();
      const suggested = last ? state.merchants.find((m) => m.id === last.merchantId) : null;
      if (suggested) {
        state.merchant = suggested;
        state.merchantIndex = state.merchants.indexOf(suggested);
      }
    }

    if (state.merchant) {
      await transition("CONFIRM");
    } else {
      await transition("PICK_MERCHANT");
    }
  } catch (e) {
    state.amount = null;
    state.merchant = null;
    state.transcript = `Parse error: ${(e as Error).message}`;
    await transition("IDLE");
  }
}