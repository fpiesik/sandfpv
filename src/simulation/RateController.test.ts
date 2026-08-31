import { describe, expect, it } from "vitest";
import { applyRateCurve } from "./RateController";

describe("applyRateCurve", () => {
  it("maps center and end points to zero and the configured maximum", () => {
    expect(applyRateCurve(0, 720, 0.4)).toBe(0);
    expect(applyRateCurve(1, 720, 0.4)).toBeCloseTo(4 * Math.PI);
    expect(applyRateCurve(-1, 720, 0.4)).toBeCloseTo(-4 * Math.PI);
  });

  it("is linear when expo is zero", () => {
    expect(applyRateCurve(0.5, 360, 0)).toBeCloseTo(Math.PI);
  });

  it("softens the center while retaining the maximum rate", () => {
    expect(applyRateCurve(0.5, 360, 0.7)).toBeLessThan(
      applyRateCurve(0.5, 360, 0),
    );
    expect(applyRateCurve(1, 360, 0.7)).toBeCloseTo(2 * Math.PI);
  });

  it("clamps invalid stick and expo ranges", () => {
    expect(applyRateCurve(2, 180, 2)).toBeCloseTo(Math.PI);
    expect(applyRateCurve(-2, 180, -1)).toBeCloseTo(-Math.PI);
  });
});
