/**
 * API utilities for Glance Pay G2 app.
 */

import { Merchant } from "../../../shared/types";
import { haversineMeters, sortMerchantsByDistance } from "./geo";

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "http://127.0.0.1:8787";

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
    // geolocation denied or unavailable — keep original merchant order
  }
  return null;
}

export async function loadMerchants(): Promise<any[]> {
  let merchants: any[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/merchants`);
    if (res.ok) {
      const data = await res.json();
      merchants = data.merchants || [];
    }
  } catch {
    // fallback
  }
  if (merchants.length === 0) {
    merchants = [
      { id: "cafe-x", name: "Café X", address: "Church St, Bengaluru", lat: 12.9716, lng: 77.5946, upiUri: "upi://pay?pa=cafex@upi&pn=Cafe%20X&cu=INR", category: "cafe", aliases: ["cafe x"] },
      { id: "blue-tokai", name: "Blue Tokai", address: "Church St, Bengaluru", lat: 12.97172, lng: 77.59475, upiUri: "upi://pay?pa=bluetokai@okaxis&pn=Blue%20Tokai&cu=INR", category: "cafe", aliases: ["blue tokai"] },
    ];
  }
  return sortMerchantsByDistance(merchants, (window as any).userLocation);
}

export async function executePayment(): Promise<{ ok: boolean; txHash?: string; explorerLink?: string; emailId?: string; error?: string }> {
  const { state } = await import("../state");
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

export async function loadUserLocationGlobal(): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const position = await new Promise<any>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    });
    if (position && position.coords) {
      (window as any).userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    }
  } catch {
    // geolocation denied or unavailable
  }
}