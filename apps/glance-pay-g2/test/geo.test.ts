import { describe, test, expect } from "vitest";
import { haversineMeters, sortMerchantsByDistance } from "../src/utils/geo";

describe("haversineMeters", () => {
  test("calculates distance between two points", () => {
    const cafeX = { lat: 12.9716, lng: 77.5946 };
    const blueTokai = { lat: 12.97172, lng: 77.59475 };
    
    const distance = haversineMeters(cafeX, blueTokai);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(1000); // Should be ~20m
  });

  test("returns 0 for same point", () => {
    const point = { lat: 12.9716, lng: 77.5946 };
    expect(haversineMeters(point, point)).toBe(0);
  });

  test("calculates longer distances correctly", () => {
    const bengaluru = { lat: 12.9716, lng: 77.5946 };
    const delhi = { lat: 28.6139, lng: 77.2090 };
    
    const distance = haversineMeters(bengaluru, delhi);
    expect(distance).toBeGreaterThan(1700000); // ~1700km
    expect(distance).toBeLessThan(1800000);
  });

  test("handles negative coordinates", () => {
    const point1 = { lat: -33.8688, lng: 151.2093 }; // Sydney
    const point2 = { lat: -34.9285, lng: 138.6007 }; // Adelaide
    
    const distance = haversineMeters(point1, point2);
    expect(distance).toBeGreaterThan(1100000); // ~1160km
    expect(distance).toBeLessThan(1200000);
  });

  test("symmetric distance", () => {
    const a = { lat: 12.9716, lng: 77.5946 };
    const b = { lat: 12.97172, lng: 77.59475 };
    
    expect(haversineMeters(a, b)).toBe(haversineMeters(b, a));
  });
});

describe("sortMerchantsByDistance", () => {
  const merchants = [
    { id: "1", name: "Far Cafe", lat: 12.9716, lng: 77.5946 },
    { id: "2", name: "Near Cafe", lat: 12.9716, lng: 77.5946 },
    { id: "3", name: "Medium Cafe", lat: 12.9716, lng: 77.5946 },
  ];

  test("sorts by distance from origin", () => {
    const origin = { lat: 12.9716, lng: 77.5946 };
    
    // All at same location, order preserved
    const sorted = sortMerchantsByDistance(merchants, origin);
    expect(sorted.map(m => m.id)).toEqual(["1", "2", "3"]);
  });

  test("sorts by actual distance", () => {
    const merchantsWithDistance = [
      { id: "1", name: "Far", lat: 13.0, lng: 77.6 }, // ~45km
      { id: "2", name: "Near", lat: 12.9716, lng: 77.5946 }, // 0km
      { id: "3", name: "Medium", lat: 12.98, lng: 77.59 }, // ~1km
    ];
    
    const origin = { lat: 12.9716, lng: 77.5946 };
    const sorted = sortMerchantsByDistance(merchantsWithDistance, origin);
    expect(sorted.map(m => m.id)).toEqual(["2", "3", "1"]);
  });

  test("returns copy when no origin provided", () => {
    const sorted = sortMerchantsByDistance(merchants, null);
    expect(sorted).not.toBe(merchants);
    expect(sorted).toEqual(merchants);
  });

  test("returns copy when origin has invalid coordinates", () => {
    const sorted = sortMerchantsByDistance(merchants, { lat: NaN, lng: NaN });
    expect(sorted).not.toBe(merchants);
    expect(sorted).toEqual(merchants);
  });

  test("returns copy when origin has non-finite coordinates", () => {
    const sorted = sortMerchantsByDistance(merchants, { lat: Infinity, lng: -Infinity });
    expect(sorted).not.toBe(merchants);
    expect(sorted).toEqual(merchants);
  });

  test("does not mutate original array", () => {
    const merchantsCopy = [...merchants];
    sortMerchantsByDistance(merchants, { lat: 12.9716, lng: 77.5946 });
    expect(merchants).toEqual(merchantsCopy);
  });

  test("handles empty array", () => {
    expect(sortMerchantsByDistance([], { lat: 0, lng: 0 })).toEqual([]);
  });
});