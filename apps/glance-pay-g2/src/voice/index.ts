/**
 * Voice pipeline for Glance Pay G2 app.
 * Handles wake word detection, audio buffering, STT, and command parsing.
 */

import { state } from "../state";
import { parseVoice, ParseResult } from "../parser";
import { executePayment } from "../utils/api";
import { transition } from "../lens";
import { loadLastPayment, saveLastPayment } from "../state";
import { getAudioActive, setAudioActive } from "./audio";

const WAKE_WORD = "pay";
const COMMANDS = ["confirm", "cancel", "repeat", "help", "status"] as const;

let audioContext: AudioContext | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let isRecording = false;
const AUDIO_BUFFER_DURATION_MS = 30000; // 30 seconds rolling buffer

/**
 * Initialize audio context and request microphone permission
 */
export async function initVoicePipeline(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("MediaDevices API not available");
      return false;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    
    // Create a script processor for real-time audio capture (deprecated but works)
    // For production, use AudioWorklet
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);
    
    processor.onaudioprocess = (event) => {
      if (isRecording) {
        const inputData = event.inputBuffer.getChannelData(0);
        // Convert float32 to int16 for recording
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        // Store in rolling buffer (simplified - in production use ring buffer)
        // This is a simplified version; production would use a ring buffer
      }
    };

    return true;
  } catch (error) {
    console.error("Failed to initialize voice pipeline:", error);
    return false;
  }
}

/**
 * Start recording audio for STT
 */
export async function startVoiceRecording(): Promise<void> {
  if (isRecording) return;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    audioChunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start(100); // Collect data every 100ms
    isRecording = true;
    setAudioActive(true);
  } catch (error) {
    console.error("Failed to start recording:", error);
    throw error;
  }
}

/**
 * Stop recording and return audio blob
 */
export async function stopVoiceRecording(): Promise<Blob | null> {
  if (!mediaRecorder || !isRecording) return null;

  return new Promise((resolve) => {
    if (!mediaRecorder) {
      resolve(null);
      return;
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/webm;codecs=opus" });
      audioChunks = [];
      isRecording = false;
      setAudioActive(false);
      resolve(blob);
    };

    mediaRecorder.stop();
  });
}

/**
 * Detect wake word in transcript
 */
export function detectWakeWord(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim();
  return lower.startsWith(WAKE_WORD + " ") || lower === WAKE_WORD;
}

/**
 * Extract command from transcript after wake word
 */
export function extractCommand(transcript: string): string | null {
  const lower = transcript.toLowerCase().trim();
  
  if (!detectWakeWord(transcript)) return null;
  
  const afterWake = lower.slice(WAKE_WORD.length).trim();
  
  // Check for known commands
  for (const cmd of COMMANDS) {
    if (afterWake.startsWith(cmd)) {
      return cmd;
    }
  }
  
  // If no known command, treat as payment phrase
  if (afterWake) {
    return "payment";
  }
  
  return null;
}

/**
 * Process voice transcript through full pipeline
 */
export async function processVoicePipeline(transcript: string): Promise<void> {
  const command = extractCommand(transcript);
  
  if (!command) {
    // Not a valid command, treat as potential payment phrase
    await processVoice(transcript);
    return;
  }

  switch (command) {
    case "confirm":
      if (state.state === "CONFIRM" || state.state === "PICK_MERCHANT") {
        if (!state.merchant && state.merchants.length > 0) {
          state.merchant = state.merchants[state.merchantIndex];
        }
        if (!state.amount) state.amount = 12.5;
        await transition("PENDING");
        const result = await executePayment();
        if (state.state !== "PENDING") return;
        await transition(result.ok ? "SUCCESS" : "FAILED");
      } else if (state.state === "IDLE" || state.state === "LISTENING") {
        state.amount = 12.5;
        state.merchant = state.merchants[0] || null;
        await transition("CONFIRM");
      }
      break;

    case "cancel":
      if (state.state !== "IDLE") {
        await transition("IDLE");
      }
      break;

    case "repeat":
      const last = loadLastPayment();
      const suggested = last ? state.merchants.find((m) => m.id === last.merchantId) : null;
      if (suggested) {
        state.merchant = suggested;
        state.merchantIndex = state.merchants.indexOf(suggested);
        state.amount = last.amount;
        await transition("CONFIRM");
      } else {
        // No last payment, go to listening
        await transition("LISTENING");
      }
      break;

    case "help":
      // Could show help on lens or speak help
      console.info("Help: say 'pay [amount] to [merchant]', 'confirm', 'cancel', 'repeat', 'status'");
      break;

    case "status":
      // Speak current status
      console.info(`Status: ${state.state}, Amount: ${state.amount}, Merchant: ${state.merchant?.name}`);
      break;

    case "payment":
      // Process as payment phrase
      await processVoice(afterWake);
      break;

    default:
      // Treat as payment phrase
      await processVoice(transcript);
  }
}

/**
 * Main voice processing - called from bridge when voice transcript received
 */
export async function processVoice(transcript: string): Promise<void> {
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

// Re-export for backward compatibility
export { parseVoice, ParseError } from "../parser";