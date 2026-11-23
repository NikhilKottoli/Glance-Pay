/**
 * State management for Glance Pay G2 app.
 */

import { AppState, LensState, Merchant } from "../../../shared/types";
import { LAST_PAYMENT_KEY } from "../../../shared/constants";
import { sortMerchantsByDistance } from "../utils/geo";
import { loadMerchants } from "../utils/api";

const LensState = Object.freeze({
  IDLE: "IDLE",
  LISTENING: "LISTENING",
  PICK_MERCHANT: "PICK_MERCHANT",
  CONFIRM: "CONFIRM",
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
});

interface LastPayment {
  merchantId: string;
  amount: number;
}

function loadLastPayment(): LastPayment | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(LAST_PAYMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.merchantId === "string" &&
      Number.isFinite(parsed.amount) &&
      parsed.amount > 0
    ) {
      return parsed;
    }
  } catch {
    // corrupted or unavailable storage — ignore
  }
  return null;
}

function saveLastPayment(payment: LastPayment): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_PAYMENT_KEY, JSON.stringify(payment));
    }
  } catch {
    // storage may be disabled in the WebView; defaults are optional
  }
}

export const state: AppState = {
  state: "IDLE",
  amount: null,
  merchant: null,
  merchantIndex: 0,
  merchants: [],
  txHash: null,
  emailId: null,
  transcript: null,
  userLocation: null,
};

export async function loadUserLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.geolocation) return null;
    const position = await new Promise<any>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    });
    if (position && position.coords) {
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    }
  } catch {
    // geolocation denied or unavailable
  }
  return null;
}

export { LensState, loadLastPayment, saveLastPayment, loadMerchants, sortMerchantsByDistance };