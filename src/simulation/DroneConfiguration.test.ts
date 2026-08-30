import { describe, expect, it } from "vitest";
import { DEFAULT_DRONE_CONFIG } from "./Drone";
import {
  DRONE_CONFIGURATION_KEY,
  loadDroneConfiguration,
} from "./DroneConfiguration";

function storageWith(value: unknown): Pick<Storage, "getItem"> {
  return {
    getItem: (key) =>
      key === DRONE_CONFIGURATION_KEY ? JSON.stringify(value) : null,
  };
}

describe("loadDroneConfiguration", () => {
  it("fills controller gains missing from a configuration saved by an older release", () => {
    const config = loadDroneConfiguration(
      storageWith({
        rollController: { kp: 0.001, ki: 0, kd: 0 },
      }),
    );

    expect(config.rollController).toEqual({
      kp: 0.001,
      ki: 0,
      kd: 0,
      feedForward: DEFAULT_DRONE_CONFIG.rollController.feedForward,
    });
    expect(config.pitchController).toEqual(
      DEFAULT_DRONE_CONFIG.pitchController,
    );
  });

  it.each([
    { rollController: { kp: null } },
    { pitchController: { kd: "invalid" } },
    { inertiaYawKgM2: null },
    { wheelbaseM: 0 },
  ])("rejects values that could introduce NaN physics", (stored) => {
    expect(loadDroneConfiguration(storageWith(stored))).toEqual(
      DEFAULT_DRONE_CONFIG,
    );
  });
});
