import { describe, it, expect } from "vitest";
import { haversineMiles, isUsZip, nearestSite } from "@/lib/geo";

describe("geo helpers", () => {
  it("detects US ZIPs", () => {
    expect(isUsZip("94043")).toBe(true);
    expect(isUsZip("San Jose")).toBe(false);
    expect(isUsZip("9404")).toBe(false);
  });

  it("computes great-circle distance (SF↔LA ≈ 347 mi)", () => {
    const sf = { lat: 37.7749, lon: -122.4194 };
    const la = { lat: 34.0522, lon: -118.2437 };
    const d = haversineMiles(sf, la);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(360);
  });

  it("picks the nearest site with coordinates and prefers recruiting", () => {
    const user = { lat: 37.77, lon: -122.42 }; // SF
    const sites = [
      { city: "New York", lat: 40.71, lon: -74.0, status: "RECRUITING" },
      { city: "Sacramento", lat: 38.58, lon: -121.49, status: "RECRUITING" },
      { city: "No coords" }, // ignored
    ];
    const n = nearestSite(user, sites);
    expect(n?.location.city).toBe("Sacramento");
    expect(n?.miles).toBeLessThan(150);
  });
});
