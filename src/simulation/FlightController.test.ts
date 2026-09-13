import { describe, expect, it } from "vitest";
import { controlAuthority, rateCurve } from "./FlightController";

describe("rateCurve", () => {
  it("maps endpoints to the configured maximum rate", () => {
    expect(rateCurve(1, 12, 0.65)).toBe(12);
    expect(rateCurve(-1, 12, 0.65)).toBe(-12);
  });

  it("is symmetric and applies expo around stick center", () => {
    expect(rateCurve(0, 10, 0.7)).toBe(0);
    expect(rateCurve(0.5, 10, 0.7)).toBeCloseTo(2.375);
    expect(rateCurve(-0.5, 10, 0.7)).toBeCloseTo(-2.375);
    expect(rateCurve(0.5, 10, 0.7)).toBeLessThan(rateCurve(0.5, 10, 0));
  });

  it("clamps malformed and out-of-range stick input", () => {
    expect(rateCurve(2, 8, 0.5)).toBe(8);
    expect(rateCurve(Number.NaN, 8, 0.5)).toBe(0);
  });
});

describe("controlAuthority", () => {
  it("retains limited air-mode authority and grows with motor speed", () => {
    expect(controlAuthority(0)).toBeCloseTo(0.12);
    expect(controlAuthority(0.25)).toBeCloseTo(0.56);
    expect(controlAuthority(1)).toBe(1);
  });

  it("clamps invalid throttle values", () => {
    expect(controlAuthority(-1)).toBeCloseTo(0.12);
    expect(controlAuthority(2)).toBe(1);
    expect(controlAuthority(Number.NaN)).toBeCloseTo(0.12);
  });
});
