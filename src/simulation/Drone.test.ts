import RAPIER from "@dimforge/rapier3d-compat";
import { beforeAll, describe, expect, it } from "vitest";
import { Drone, type DroneConfig } from "./Drone";
import { AIR65_II_RACING } from "./DronePresets";

const config: DroneConfig = structuredClone(AIR65_II_RACING);

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
      { ...config, motorTimeConstantUp: 0, motorTimeConstantDown: 0 },
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

  it("replaces persistent forces on every physics tick", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(world, {
      ...config,
      motorTimeConstantUp: 0,
      motorTimeConstantDown: 0,
    });

    drone.update(1, 1 / 120);
    world.step();
    const velocityAfterThrust = drone.body.linvel().y;
    drone.update(0, 1 / 120);
    world.step();

    expect(drone.body.linvel().y).toBeCloseTo(velocityAfterThrust);
  });

  it("creates body torque from an acro rate command", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(world, {
      ...config,
      rollController: { ...config.rollController, kd: 0 },
    });

    drone.update(0, 1 / 120, { roll: 1, pitch: 0, yaw: 0 });

    expect(drone.flightControllerDebug.desiredRates.x).toBeGreaterThan(0);
    expect(drone.flightControllerDebug.torques.x).toBeGreaterThan(0);
    expect(drone.flightControllerDebug.desiredRates.y).toBe(0);
  });

  it.each(["roll", "pitch"] as const)(
    "responds visibly to a small %s command",
    (control) => {
      const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
      world.timestep = 1 / 120;
      const drone = new Drone(world, { ...config, rateExpo: 0.7 });
      const controls = { roll: 0, pitch: 0, yaw: 0 };
      controls[control] = 0.1;

      for (let step = 0; step < 12; step += 1) {
        drone.update(0, world.timestep, controls);
        world.step();
      }

      const axis = control === "roll" ? "x" : "z";
      expect(Math.abs(drone.body.angvel()[axis])).toBeGreaterThan(0.25);
    },
  );

  it.each([
    ["roll", { roll: 1, pitch: 0, yaw: 0 }, "x"],
    ["pitch", { roll: 0, pitch: 1, yaw: 0 }, "z"],
    ["yaw", { roll: 0, pitch: 0, yaw: 1 }, "y"],
  ] as const)(
    "rotates the rigid body in response to %s",
    (_name, controls, axis) => {
      const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
      world.timestep = 1 / 120;
      const drone = new Drone(world, {
        ...config,
        rollController: { ...config.rollController, kd: 0 },
        pitchController: { ...config.pitchController, kd: 0 },
        yawController: { ...config.yawController, kd: 0 },
      });

      for (let step = 0; step < 10; step += 1) {
        drone.update(0, world.timestep, controls);
        world.step();
      }

      expect(Math.abs(drone.body.angvel()[axis])).toBeGreaterThan(0.01);
    },
  );

  it("clamps throttle commands and applies the configured motor range", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(world, {
      ...config,
      minMotorThrottle: 0.1,
      maxMotorThrottle: 0.8,
      motorTimeConstantUp: 0,
      motorTimeConstantDown: 0,
    });

    drone.update(-1, 1 / 120);
    expect(drone.currentMotorThrottle).toBeCloseTo(0.1);
    drone.update(2, 1 / 120);
    expect(drone.currentMotorThrottle).toBeCloseTo(0.8);
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
