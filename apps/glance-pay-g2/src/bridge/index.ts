/**
 * Even Hub Bridge event handling for Glance Pay G2 app.
 */

import { state, LensState, loadLastPayment, saveLastPayment, onConfirmEnter, onConfirmExit } from "../state";
import { executePayment } from "../utils/api";
import { eventSourceLabel, collectPcm, transcribePcm, getAudioActive, setAudioActive } from "./audio";
import { processVoice } from "./voice";
import { renderLens, transition } from "../lens";
import { loadLastPayment as loadLastPaymentUtil, saveLastPayment as saveLastPaymentUtil } from "../state";

import * as audioModule from "./audio";

export const setBridge = (b: any) => {
  audioModule.setBridge(b);
};

export const getBridge = () => {
  return audioModule.getBridge();
};

export async function handleBridgeEvent(evt: any, bridgeInstance: any) {
  audioModule.setBridge(bridgeInstance);
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

  const source = eventSourceLabel(evt);
  const fromRing = source === "RING";

  // Double-click / Long-press → IDLE
  if (typeStr.includes("DOUBLE_CLICK") || typeStr === "3" || typeStr === "DOUBLE_CLICK_EVENT") {
    if (getAudioActive()) {
      const b = getBridge();
      if (b) { try { await b.audioControl(false); } catch {} }
    }
    await transition("IDLE");
    console.info(`[glance-pay] cancel via ${fromRing ? "R1 ring" : "glasses"}`);
    return;
  }

  if (typeStr.includes("LONG_PRESS") || typeStr === "9" || typeStr === "LONG_PRESS_EVENT") {
    await transition("IDLE");
    return;
  }

  const isClick = typeStr.includes("CLICK") || typeStr === "0" || typeStr === "CLICK_EVENT" || eventType === undefined;

  if (isClick) {
    switch (state.state) {
      case "IDLE": {
        await transition("LISTENING");
        const b = getBridge();
        if (b) {
          try {
            const sdk = await import("@evenrealities/even_hub_sdk");
            await b.audioControl(true, sdk.AudioInputSource.Glasses);
          } catch {
            // continue with demo
          }
        }
        const pcm = await collectPcm();
        const transcript = await transcribePcm(pcm);
        await processVoicePipeline(transcript);
        return;
      }
      case "PICK_MERCHANT": {
        if (state.merchants.length > 0) {
          state.merchant = state.merchants[state.merchantIndex];
          await transition("CONFIRM");
          console.info(`[glance-pay] select via ${fromRing ? "R1 ring" : "glasses"}`);
        }
        return;
      }
      case "CONFIRM": {
        onConfirmEnter();
        await transition("PENDING");
        console.info(`[glance-pay] confirm via ${fromRing ? "R1 ring" : "glasses"}`);
        const result = await executePayment();
        onConfirmExit();
        if (state.state !== "PENDING") return;
        await transition(result.ok ? "SUCCESS" : "FAILED");
        return;
      }
      case "FAILED": {
        state.txHash = null; state.emailId = null;
        onConfirmExit();
        await transition("CONFIRM");
        return;
      }
      case "SUCCESS": {
        state.amount = null; state.merchant = null; state.txHash = null; state.emailId = null; state.transcript = null;
        onConfirmExit();
        await transition("IDLE");
        return;
      }
    }
    return;
  }

  const isScrollTop = typeStr.includes("SCROLL_TOP") || typeStr === "1" || typeStr === "SCROLL_TOP_EVENT";
  const isScrollBottom = typeStr.includes("SCROLL_BOTTOM") || typeStr === "2" || typeStr === "SCROLL_BOTTOM_EVENT";

  if ((isScrollTop || isScrollBottom) && state.state === "PICK_MERCHANT" && state.merchants.length > 1) {
    if (isScrollBottom) {
      state.merchantIndex = (state.merchantIndex + 1) % state.merchants.length;
    } else {
      state.merchantIndex = (state.merchantIndex - 1 + state.merchants.length) % state.merchants.length;
    }
    await renderLens();
  }
}

export function handleAudioEvent(audioEvent: any) {
  audioModule.handleAudioEvent(audioEvent);
}