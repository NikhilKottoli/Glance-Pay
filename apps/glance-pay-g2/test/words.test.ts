import { describe, test, expect } from "vitest";
import { wordToNumber, wordsToNumber } from "../src/parser/words";

describe("wordToNumber", () => {
  test("parses basic numbers", () => {
    expect(wordToNumber("zero")).toBe(0);
    expect(wordToNumber("oh")).toBe(0);
    expect(wordToNumber("one")).toBe(1);
    expect(wordToNumber("twelve")).toBe(12);
    expect(wordToNumber("twenty")).toBe(20);
    expect(wordToNumber("ninety")).toBe(90);
  });

  test("parses hyphenated numbers", () => {
    expect(wordToNumber("twenty-one")).toBe(21);
    expect(wordToNumber("thirty-five")).toBe(35);
    expect(wordToNumber("ninety-nine")).toBe(99);
  });

  test("case insensitive", () => {
    expect(wordToNumber("ONE")).toBe(1);
    expect(wordToNumber("Twenty")).toBe(20);
    expect(wordToNumber("Ninety-Nine")).toBe(99);
  });

  test("handles punctuation", () => {
    expect(wordToNumber("one,")).toBe(1);
    expect(wordToNumber(".two")).toBe(2);
    expect(wordToNumber("three.")).toBe(3);
  });

  test("returns null for unknown words", () => {
    expect(wordToNumber("eleventy")).toBeNull();
    expect(wordToNumber("foobar")).toBeNull();
  });
});

describe("wordsToNumber", () => {
  test("parses direct numbers", () => {
    expect(wordsToNumber(["12.50"])).toBe(12.5);
    expect(wordsToNumber(["200"])).toBe(200);
  });

  test("parses single word numbers", () => {
    expect(wordsToNumber(["one"])).toBe(1);
    expect(wordsToNumber(["twelve"])).toBe(12);
    expect(wordsToNumber(["twenty"])).toBe(20);
  });

  test("parses compound word numbers", () => {
    expect(wordsToNumber(["twelve", "fifty"])).toBe(12.5);
    expect(wordsToNumber(["one", "fifty"])).toBe(1.5);
    expect(wordsToNumber(["one", "hundred", "fifty"])).toBe(150);
    expect(wordsToNumber(["two", "thousand", "fifty"])).toBe(2050);
  });

  test("handles hundred correctly", () => {
    expect(wordsToNumber(["hundred"])).toBe(100);
    expect(wordsToNumber(["one", "hundred"])).toBe(100);
    expect(wordsToNumber(["two", "hundred", "fifty"])).toBe(250);
  });

  test("handles thousand correctly", () => {
    expect(wordsToNumber(["thousand"])).toBe(1000);
    expect(wordsToNumber(["two", "thousand"])).toBe(2000);
    expect(wordsToNumber(["one", "thousand", "two", "hundred"])).toBe(1200);
  });

  test("handles lakh and million", () => {
    expect(wordsToNumber(["lakh"])).toBe(100000);
    expect(wordsToNumber(["million"])).toBe(1000000);
  });

  test("returns null for invalid input", () => {
    expect(wordsToNumber(["foobar"])).toBeNull();
    expect(wordsToNumber(["one", "foo", "two"])).toBeNull();
    expect(wordsToNumber([])).toBeNull();
  });
});