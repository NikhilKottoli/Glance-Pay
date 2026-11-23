/**
 * Shared types for Glance Pay — used by both G2 app and Web panel.
 */

export interface Merchant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  upiUri: string;
  category: string;
  aliases: string[];
}

export interface Payment {
  id: string;
  time: string;
  merchantId: string;
  merchant: string;
  amount: number;
  usdc: number;
  wallet: string;
  state: string;
  txHash: string;
  blockNumber?: number;
  from?: string;
  explorerLink?: string;
  emailId?: string;
  signedByServer?: boolean;
}

export interface ChainConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorer: string;
  usdc: string;
  treasury: string;
  usdcDecimals: number;
}

export interface ParseResult {
  amount: number;
  merchant?: string;
}

export class ParseError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ParseError";
  }
}

export type LensState =
  | "IDLE"
  | "LISTENING"
  | "PICK_MERCHANT"
  | "CONFIRM"
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

export interface AppState {
  state: string;
  amount: number | null;
  merchant: Merchant | null;
  merchantIndex: number;
  merchants: Merchant[];
  txHash: string | null;
  emailId: string | null;
  transcript: string | null;
  userLocation: { lat: number; lng: number } | null;
}