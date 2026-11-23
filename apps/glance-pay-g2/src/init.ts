/**
 * Glance Pay G2 app initialization.
 */

import { state, LensState, loadLastPayment, saveLastPayment, loadMerchants, loadUserLocation } from "./state";
import { renderLens, transition, LensState } from "./lens";
import { handleBridgeEvent } from "./bridge";
import { eventSourceLabel, handleAudioEvent, setBridge } from "./bridge/audio";
import { loadUserLocationGlobal } from "./utils/api";

let bridge: any = null;
let pcmChunks: Uint8Array[] = [];
let audioActive = false;

const PCM_CHUNK_MS = 100;
const LISTEN_DURATION_MS = 2500;

async function transition(newState: string) {
  state.state = newState;
  await renderLens();
}

export async function init() {
  // Load user location first, then merchants (sorted by distance)
  await loadUserLocationGlobal();
  await loadUserLocation();
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
        { containerID: 1, containerName: "line1", xPosition: 0, yPosition: 10, width: 576, height: 80, isEventCapture: 1, zOrderIndex: 1, textColor: 0, content: l1 },
        { containerID: 2, containerName: "line2", xPosition: 0, yPosition: 100, width: 576, height: 80, isEventCapture: 0, zOrderIndex: 2, textColor: 0, content: l2 },
        { containerID: 3, containerName: "line3", xPosition: 0, yPosition: 190, width: 576, height: 80, isEventCapture: 0, zOrderIndex: 3, textColor: 0, content: l3 },
      ],
    });

    bridge.onEvenHubEvent(async (event: any) => {
      const evtSource = eventSourceLabel(event);
      const dbg = (id: string, value: string) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };
      dbg(evtSource === "RING" ? "R1 dbg-event" : "dbg-event", JSON.stringify(event).slice(0, 100));
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
    await transition("IDLE");
  });

  document.getElementById("btn-demo-voice")?.addEventListener("click", async () => {
    await transition("LISTENING");
    await new Promise((r) => setTimeout(r, 1500));
    const { processVoice } = await import("./bridge");
    await processVoice("pay 12.50");
  });

  document.getElementById("btn-approve")?.addEventListener("click", async () => {
    if (state.state === "CONFIRM" || state.state === "PICK_MERCHANT") {
      if (!state.merchant && state.merchants.length > 0) state.merchant = state.merchants[state.merchantIndex];
      if (!state.amount) state.amount = 12.5;
      await transition("PENDING");
      const { executePayment } = await import("./utils/api");
      const result = await executePayment();
      if (state.state !== "PENDING") return;
      await transition(result.ok ? "SUCCESS" : "FAILED");
    } else if (state.state === "IDLE" || state.state === "LISTENING") {
      state.amount = 12.5;
      state.merchant = state.merchants[0] || null;
      await transition("CONFIRM");
    }
  });

  await renderLens();
}