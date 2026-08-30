import { describe, expect, it } from "vitest";
import {
  INPUT_CONFIGURATION_KEY,
  INPUT_CONFIGURATION_VERSION,
  loadInputConfiguration,
} from "./InputConfiguration";

const calibration = {
  axis: 0,
  minimum: -1,
  maximum: 1,
  center: 0,
  inverted: false,
  deadband: 0.05,
};

function storageWith(value: unknown): Pick<Storage, "getItem"> {
  return {
    getItem: (key) =>
      key === INPUT_CONFIGURATION_KEY ? JSON.stringify(value) : null,
  };
}

function configuration(axis = calibration): unknown {
  return {
    version: INPUT_CONFIGURATION_VERSION,
    gamepadId: "controller",
    axes: {
      throttle: axis,
      roll: { ...calibration, axis: 1 },
      pitch: { ...calibration, axis: 2 },
      yaw: { ...calibration, axis: 3 },
    },
  };
}

describe("loadInputConfiguration", () => {
  it("migrates version-1 calibrations saved before deadband was added", () => {
    const legacyCalibration = {
      axis: calibration.axis,
      minimum: calibration.minimum,
      maximum: calibration.maximum,
      center: calibration.center,
      inverted: calibration.inverted,
    };

    const loaded = loadInputConfiguration(
      storageWith(configuration(legacyCalibration as typeof calibration)),
    );

    expect(loaded?.axes.throttle.deadband).toBe(0.05);
  });

  it.each([
    { ...calibration, center: Number.NaN },
    { ...calibration, minimum: 1, maximum: -1 },
    { ...calibration, axis: -1 },
    { ...calibration, deadband: 0.9 },
  ])("rejects malformed calibration data: %o", (invalid) => {
    expect(loadInputConfiguration(storageWith(configuration(invalid)))).toBe(
      undefined,
    );
  });
});
