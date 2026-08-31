import { describe, expect, it } from "vitest";
import {
  normalizeCenteredAxis,
  normalizeThrottleAxis,
  type AxisCalibration,
} from "./AxisNormalization";

const calibration: AxisCalibration = {
  axis: 0,
  minimum: -0.8,
  maximum: 0.9,
  center: 0.1,
  inverted: false,
  deadband: 0,
};

describe("axis normalization", () => {
  it("normalizes asymmetric centered axes to -1..1", () => {
    expect(normalizeCenteredAxis(-0.8, calibration)).toBe(-1);
    expect(normalizeCenteredAxis(0.1, calibration)).toBe(0);
    expect(normalizeCenteredAxis(0.9, calibration)).toBe(1);
  });

  it("normalizes throttle to 0..1", () => {
    expect(normalizeThrottleAxis(-0.8, calibration)).toBe(0);
    expect(normalizeThrottleAxis(0.05, calibration)).toBeCloseTo(0.5);
    expect(normalizeThrottleAxis(0.9, calibration)).toBe(1);
  });

  it("removes deadband and rescales the remaining travel", () => {
    const deadband = {
      ...calibration,
      minimum: -1,
      maximum: 1,
      center: 0,
      deadband: 0.1,
    };
    expect(normalizeCenteredAxis(0.08, deadband)).toBe(0);
    expect(normalizeCenteredAxis(0.55, deadband)).toBeCloseTo(0.5);
    expect(normalizeCenteredAxis(-0.55, deadband)).toBeCloseTo(-0.5);
  });

  it("limits legacy deadband values that would disable most stick travel", () => {
    const legacyCalibration = { ...calibration, deadband: 0.99 };

    expect(normalizeCenteredAxis(0.5, legacyCalibration)).toBeCloseTo(0.375);
    expect(normalizeThrottleAxis(0.5, legacyCalibration)).toBeGreaterThan(0.7);
  });

  it("inverts centered and throttle axes", () => {
    const inverted = { ...calibration, inverted: true };
    expect(normalizeCenteredAxis(0.9, inverted)).toBe(-1);
    expect(normalizeThrottleAxis(-0.8, inverted)).toBe(1);
    expect(normalizeThrottleAxis(0.9, inverted)).toBe(0);
  });
});
