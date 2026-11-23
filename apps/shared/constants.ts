/**
 * Shared constants for Glance Pay.
 */

export const USD_RATE = 83; // INR per USDC (approximate)

export const LAST_PAYMENT_KEY = "glancepay.lastPayment";

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "http://127.0.0.1:8787";

export const RING_SOURCE = 2;

export const PCM_CHUNK_MS = 100;
export const LISTEN_DURATION_MS = 2500;

export const LENS_CONFIG = {
  line1: { containerID: 1, y: 10, h: 80 },
  line2: { containerID: 2, y: 100, h: 80 },
  line3: { containerID: 3, y: 190, h: 80 },
};

export const MAX_AMOUNT_INR = 500;
export const MIN_AMOUNT_INR = 0.01;

export const AMOUNT_UNITS_MULTIPLIER = 1_000_000; // USDC has 6 decimals