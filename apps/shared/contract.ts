/**
 * Frozen message contract for Glance Pay G2 app.
 * This contract defines the interface between the G2 lens app and the backend.
 * Version: 1.0.0 - DO NOT MODIFY WITHOUT VERSION BUMP
 */

import { Merchant, Payment, ParseResult, LensState } from "./types";

/**
 * Message contract between G2 lens app and backend
 */
export interface LensToBackendMessage {
  type: "voice_transcript" | "payment_confirm" | "payment_cancel" | "merchant_select" | "get_merchants" | "get_balance" | "get_history";
  payload: any;
  timestamp: number;
  version: string;
}

export interface BackendToLensMessage {
  type: "lens_update" | "payment_result" | "merchant_list" | "balance_update" | "error" | "history";
  payload: any;
  timestamp: number;
  version: string;
}

/**
 * Lens display state contract
 */
export interface LensDisplayState {
  line1: string;
  line2: string;
  line3: string;
  state: LensState;
  merchant?: {
    id: string;
    name: string;
    distanceMeters?: number;
  };
  amountINR?: number;
  amountUSDC?: number;
}

/**
 * Voice command contract
 */
export interface VoiceCommand {
  intent: "payment" | "confirm" | "cancel" | "repeat" | "help" | "status";
  amount?: number;
  merchant?: string;
  rawTranscript: string;
  confidence: number;
}

/**
 * Payment request contract
 */
export interface PaymentRequest {
  merchantId: string;
  amountINR: number;
  walletAddress?: string;
}

export interface PaymentResponse {
  ok: boolean;
  txHash?: string;
  explorerLink?: string;
  emailId?: string;
  error?: string;
}

/**
 * Contract version - MUST be incremented when message formats change
 * Format: MAJOR.MINOR.PATCH
 * MAJOR: Breaking changes to message format
 * MINOR: New optional fields added
 * PATCH: Bug fixes, no format changes
 */
export const CONTRACT_VERSION = "1.0.0";
export const CONTRACT_NAME = "GlancePayG2";

/**
 * Event types for bridge communication
 */
export enum BridgeEventType {
  CLICK = "CLICK_EVENT",
  DOUBLE_CLICK = "DOUBLE_CLICK_EVENT",
  SCROLL_TOP = "SCROLL_TOP_EVENT",
  SCROLL_BOTTOM = "SCROLL_BOTTOM_EVENT",
  LONG_PRESS = "LONG_PRESS_EVENT",
  LONG_PRESS_RELEASE = "LONG_PRESS_RELEASE_EVENT",
}

/**
 * Audio event contract
 */
export interface AudioEvent {
  type: "audio_pcm";
  audioPcm: Uint8Array;
  sampleRate: number;
  timestamp: number;
}

/**
 * Bridge event contract
 */
export interface BridgeEvent {
  textEvent?: {
    containerID: number;
    eventType: string;
    eventSource?: number;
  };
  sysEvent?: {
    eventType: string;
    eventSource?: number;
  };
  listEvent?: {
    eventType: string;
    eventSource?: number;
  };
  audioEvent?: AudioEvent;
}

/**
 * Frozen contract schema - DO NOT MODIFY without version bump
 * This object is used to verify compatibility at runtime
 */
export const CONTRACT_SCHEMA = {
  version: "1.0.0",
  name: "GlancePayG2",
  lensDisplay: {
    line1: "string",
    line2: "string",
    line3: "string",
    state: "enum(IDLE,LISTENING,PICK_MERCHANT,CONFIRM,PENDING,SUCCESS,FAILED)",
  },
  voiceCommand: {
    intent: "enum(payment,confirm,cancel,repeat,help,status)",
    amount: "number",
    merchant: "string?",
    rawTranscript: "string",
    confidence: "number",
  },
  payment: {
    merchantId: "string",
    amountINR: "number",
    walletAddress: "string?",
  },
  paymentResponse: {
    ok: "boolean",
    txHash: "string?",
    explorerLink: "string?",
    emailId: "string?",
    error: "string?",
  },
} as const;