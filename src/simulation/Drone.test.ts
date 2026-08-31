import RAPIER from "@dimforge/rapier3d-compat";
import { beforeAll, describe, expect, it } from "vitest";
import { Drone, type DroneConfig } from "./Drone";

const config: DroneConfig = {
  mass: 1,
  maxThrust: 20,
  linearDrag: 0,
  angularDrag: 0,
  motorResponseTime: 0.1,
};

beforeAll(async () => RAPIER.init());

describe("Drone", () => {
  it("ramps the motor up instead of applying full throttle instantly", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(world, config);

    drone.update(1, 0.01);

    expect(drone.currentMotorThrottle).toBeGreaterThan(0);
    expect(drone.currentMotorThrottle).toBeLessThan(1);
  });

  it("applies thrust along the rotated local up axis", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(
      world,
      { ...config, motorResponseTime: 0 },
      {
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      },
    );

    drone.update(1, 1 / 120);
    world.step();

    expect(drone.body.linvel().x).toBeLessThan(-0.1);
    expect(Math.abs(drone.body.linvel().y)).toBeLessThan(0.01);
  });

  it("resets transform, velocities, forces, and motor state", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(world, config);
    drone.body.setTranslation({ x: 4, y: 5, z: 6 }, true);
    drone.body.setLinvel({ x: 1, y: 2, z: 3 }, true);
    drone.body.setAngvel({ x: 3, y: 2, z: 1 }, true);
    drone.update(1, 0.1);

    drone.reset();

    expect(drone.body.translation()).toEqual({ x: 0, y: 1, z: 0 });
    expect(drone.body.linvel()).toEqual({ x: 0, y: 0, z: 0 });
    expect(drone.body.angvel()).toEqual({ x: 0, y: 0, z: 0 });
    expect(drone.currentMotorThrottle).toBe(0);
  });
});
