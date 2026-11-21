import { describe, test, expect } from "vitest";
import { parseVoice, ParseError } from "../src/main";

describe("parseVoice", () => {
  test("parses decimal amount: pay 12.50", () => {
    const r = parseVoice("pay 12.50");
    expect(r.amount).toBeCloseTo(12.5);
    expect(r.merchant).toBeUndefined();
  });

  test("parses integer amount: pay 200", () => {
    const r = parseVoice("pay 200");
    expect(r.amount).toBe(200);
    expect(r.merchant).toBeUndefined();
  });

  test("parses word amount: pay twelve fifty", () => {
    const r = parseVoice("pay twelve fifty");
    expect(r.amount).toBeCloseTo(12.5);
  });

  test("parses word amount: pay one hundred fifty", () => {
    const r = parseVoice("pay one hundred fifty");
    expect(r.amount).toBe(150);
  });

  test("parses with merchant: pay 200 to Blue Tokai", () => {
    const r = parseVoice("pay 200 to Blue Tokai");
    expect(r.amount).toBe(200);
    expect(r.merchant).toBe("Blue Tokai");
  });

  test("parses with merchant and lower case", () => {
    const r = parseVoice("pay 12.50 to cafe x");
    expect(r.amount).toBeCloseTo(12.5);
    expect(r.merchant).toBe("cafe x");
  });

  test("parses with rupees suffix: pay 50 rupees", () => {
    const r = parseVoice("pay 50 rupees");
    expect(r.amount).toBe(50);
    expect(r.merchant).toBeUndefined();
  });

  test("parses twelve fifty as 12.5", () => {
    const r = parseVoice("pay twelve fifty");
    expect(r.amount).toBeCloseTo(12.5);
  });

  test("rejects zero amount", () => {
    expect(() => parseVoice("pay 0")).toThrow(ParseError);
  });

  test("rejects negative amount", () => {
    expect(() => parseVoice("pay -10")).toThrow(ParseError);
  });

  test("rejects amount > 500", () => {
    expect(() => parseVoice("pay 501")).toThrow(ParseError);
  });

  test("rejects empty phrase", () => {
    expect(() => parseVoice("")).toThrow(ParseError);
  });

  test("rejects missing pay prefix", () => {
    expect(() => parseVoice("send 10")).toThrow(ParseError);
  });

  test("rejects no amount", () => {
    expect(() => parseVoice("pay")).toThrow(ParseError);
  });

  test("parses minimal: pay 1", () => {
    const r = parseVoice("pay 1");
    expect(r.amount).toBe(1);
  });

  test("parses maximum: pay 500", () => {
    const r = parseVoice("pay 500");
    expect(r.amount).toBe(500);
  });

  test("parses with indian unit: pay 12.50 rs", () => {
    const r = parseVoice("pay 12.50 rs");
    expect(r.amount).toBeCloseTo(12.5);
  });

  test("parses with usd unit: pay 10 dollars", () => {
    const r = parseVoice("pay 10 dollars");
    expect(r.amount).toBeCloseTo(10);
  });
});