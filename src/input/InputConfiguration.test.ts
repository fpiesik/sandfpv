import { describe, expect, it } from "vitest";
import {
  INPUT_CONFIGURATION_VERSION,
  loadInputConfiguration,
} from "./InputConfiguration";

const axes = Object.fromEntries(
  ["throttle", "yaw", "pitch", "roll"].map((name, axis) => [
    name,
    {
      axis,
      minimum: -1,
      maximum: 1,
      center: 0,
      inverted: false,
      deadband: 0.05,
    },
  ]),
);

describe("loadInputConfiguration", () => {
  it("keeps the former self-level mapping as the reset button", () => {
    const legacy = JSON.stringify({
      version: 2,
      gamepadId: "controller",
      axes,
      selfLevelButton: 7,
    });
    const storage = {
      getItem(key: string) {
        return key === "sandfpv.input.v2" ? legacy : null;
      },
    };

    expect(loadInputConfiguration(storage)).toMatchObject({
      version: INPUT_CONFIGURATION_VERSION,
      gamepadId: "controller",
      resetButton: 7,
    });
  });

  it("loads a current configuration without an optional reset button", () => {
    const current = JSON.stringify({
      version: INPUT_CONFIGURATION_VERSION,
      gamepadId: "controller",
      axes,
    });
    const storage = {
      getItem(key: string) {
        return key === "sandfpv.input.v3" ? current : null;
      },
    };

    expect(loadInputConfiguration(storage)).toMatchObject({
      version: INPUT_CONFIGURATION_VERSION,
      gamepadId: "controller",
      axes,
    });
    expect(loadInputConfiguration(storage)?.resetButton).toBeUndefined();
  });
});
