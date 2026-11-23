/**
 * Lens rendering for Glance Pay G2 app.
 * Handles both simulator display and G2 lens via Even Hub SDK.
 */

import { AppState, LensState, Merchant } from "../../../shared/types";
import { state, LensState } from "../state";
import { USD_RATE, LAST_PAYMENT_KEY } from "../../../shared/constants";
import { loadLastPayment } from "../state";
import { haversineMeters } from "../utils/geo";

const LENS_CONFIG = {
  line1: { containerID: 1, y: 10, h: 80 },
  line2: { containerID: 2, y: 100, h: 80 },
  line3: { containerID: 3, y: 190, h: 80 },
};

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

export function lensText(s: AppState): [string, string, string] {
  const amtStr = s.amount !== null ? `Rs ${s.amount.toFixed(2)}` : "";
  const usdcStr = s.amount !== null ? `${(s.amount / 83).toFixed(2)} USDC` : "";
  const merchantName = s.merchant?.name ?? "";

  switch (s.state) {
    case "IDLE": {
      const last = loadLastPayment();
      const suggested = last ? state.merchants.find((m) => m.id === last.merchantId) : null;
      if (last && suggested) {
        return ["Glance Pay", `Again? Rs ${last.amount.toFixed(2)}`, `${suggested.name} - tap to speak`];
      }
      return ["Glance Pay", "Ring or tap to pay", "Say an amount"];
    }
    case "LISTENING":
      return ["Listening...", "Say: pay 12.50", ""];
    case "PICK_MERCHANT": {
      const items = state.merchants
        .map((m, i) => `${i === state.merchantIndex ? ">" : " "}${i + 1}. ${m.name}`)
        .join("  ");
      const selected = state.merchants[state.merchantIndex];
      let hint = "Swipe - tap select";
      if (selected && state.userLocation) {
        const distance = haversineMeters(state.userLocation, selected);
        const label = distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
        hint = `${label} away - swipe - tap`;
      }
      return ["Pick merchant", items, hint];
    }
    case "CONFIRM":
      return [merchantName, `${amtStr} ~ ${usdcStr}`, "Tap to pay - ring cancel"];
    case "PENDING":
      return ["Paying...", "Onchain", ""];
    case "SUCCESS":
      return [`Paid ${amtStr}`, merchantName, "Receipt emailed"];
    case "FAILED":
      return ["Failed", "No charge made", "Tap to retry"];
    default:
      return ["Glance Pay", "", ""];
  }
}

export async function renderLens(bridge: any) {
  const [l1, l2, l3] = lensText(state);
  dbgState(state);
  // Update simulator lens display (always)
  const sim1 = document.getElementById("lens-line-1");
  const sim2 = document.getElementById("lens-line-2");
  const sim3 = document.getElementById("lens-line-3");
  if (sim1) sim1.textContent = l1;
  if (sim2) sim2.textContent = l2;
  if (sim3) sim3.textContent = l3;
  // Update G2 lens via bridge if available
  if (!bridge) return;
  try {
    await bridge.rebuildPageContainer({
      containerTotalNum: 3,
      textObject: [
        { containerID: 1, containerName: "line1", xPosition: 0, yPosition: 10, width: 576, height: 80, isEventCapture: 1, zOrderIndex: 1, textColor: 0, content: l1 },
        { containerID: 2, containerName: "line2", xPosition: 0, yPosition: 100, width: 576, height: 80, isEventCapture: 0, zOrderIndex: 2, textColor: 0, content: l2 },
        { containerID: 3, containerName: "line3", xPosition: 0, yPosition: 190, width: 576, height: 80, isEventCapture: 0, zOrderIndex: 3, textColor: 0, content: l3 },
      ],
    });
  } catch (e) {
    console.warn("renderLens error:", e);
  }
}

export async function transition(newState: string, bridge: any) {
  state.state = newState;
  await renderLens(bridge);
}

export { LensState };