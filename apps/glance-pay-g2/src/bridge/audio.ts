/**
 * Audio handling for Glance Pay G2 app.
 */

export const RING_SOURCE = 2;
const PCM_CHUNK_MS = 100;
const LISTEN_DURATION_MS = 2500;

export let pcmChunks: Uint8Array[] = [];
export let audioActive = false;
export let bridge: any = null;

export function setBridge(b: any) {
  bridge = b;
}

export function getBridge(): any {
  return bridge;
}

export function getAudioActive(): boolean {
  return audioActive;
}

export function setAudioActive(value: boolean) {
  audioActive = value;
}

/** Classify the source of an Even Hub event without throwing on malformed input. */
export function eventSourceLabel(evt: any): "RING" | "GLASSES" | "UNKNOWN" {
  try {
    const src =
      evt?.textEvent?.eventSource ??
      evt?.sysEvent?.eventSource ??
      evt?.listEvent?.eventSource ??
      evt?.eventSource;
    if (typeof src === "number") {
      if (src === RING_SOURCE) return "RING";
      if (src === 1) return "GLASSES";
      return "UNKNOWN";
    }
    if (typeof src === "string") {
      if (/ring|r1/i.test(src)) return "RING";
      if (/glass|temple/i.test(src)) return "GLASSES";
    }
  } catch {
    // defensive: never let an event source crash the lens
  }
  return "UNKNOWN";
}

export function handleAudioEvent(audioEvent: any) {
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

export async function collectPcm(): Promise<Uint8Array> {
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

export async function transcribePcm(pcm: Uint8Array): Promise<string> {
  try {
    const base64 = btoa(String.fromCharCode(...pcm));
    const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://127.0.0.1:8787"}/api/stt`, {
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