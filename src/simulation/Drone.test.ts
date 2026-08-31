import RAPIER from "@dimforge/rapier3d-compat";
import { beforeAll, describe, expect, it } from "vitest";
import { Drone, type DroneConfig } from "./Drone";

const TEST_CONFIG: DroneConfig = {
  mass: 0.025,
  maxThrust: 1,
  thrustExponent: 2,
  bodyDrag: { x: 0, y: 0, z: 0 },
  rotorDrag: 0,
  inertia: { x: 0.00001, y: 0.00002, z: 0.00001 },
  angularDrag: 0,
  motorSpoolUpTime: 0.1,
  motorSpoolDownTime: 0.02,
  maxRates: { roll: 10, pitch: 10, yaw: 8 },
  rateExpo: 0.5,
  ratePid: { kp: 0.001, ki: 0, kd: 0 },
  integralLimit: 1,
  maxTorque: 0.01,
  angleMaxTilt: Math.PI / 4,
  angleLevelGain: 5,
};

beforeAll(async () => RAPIER.init());

describe("Drone", () => {
  it("ramps its motor and applies thrust along local up", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    world.timestep = 0.01;
    const drone = new Drone(world, TEST_CONFIG, {
      rotation: {
        x: 0,
        y: 0,
        z: Math.sin(Math.PI / 4),
        w: Math.cos(Math.PI / 4),
      },
    });

    drone.applyThrottle(1, 0.01);
    world.step();

    expect(drone.currentMotorThrottle).toBeCloseTo(1 - Math.exp(-0.1));
    expect(drone.currentMotorThrottle).toBeLessThan(1);
    expect(drone.body.linvel().x).toBeLessThan(0);
    expect(Math.abs(drone.body.linvel().y)).toBeLessThan(1e-5);
  });

  it("replaces the motor force each step instead of accumulating thrust", () => {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    world.timestep = 1 / 120;
    const drone = new Drone(world, {
      ...TEST_CONFIG,
      mass: 0.05,
      maxThrust: 0.4,
      motorSpoolUpTime: 0.035,
    });

    for (let step = 0; step < 240; step += 1) {
      drone.applyThrottle(0.01, world.timestep);
      world.step();
    }

    expect(drone.body.userForce().y).toBeCloseTo(0.00004, 5);
    expect(drone.body.linvel().y).toBeLessThan(0);

    for (let step = 0; step < 120; step += 1) {
      drone.applyThrottle(0, world.timestep);
      world.step();
    }

    expect(drone.currentMotorThrottle).toBeCloseTo(0, 5);
    expect(drone.body.userForce().y).toBeCloseTo(0, 5);
  });

  it("uses nonlinear thrust and a faster spool-down response", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(world, TEST_CONFIG);
    drone.applyThrottle(1, 0.1);
    expect(drone.currentMotorThrottle).toBeCloseTo(1 - Math.exp(-1));
    const expectedThrust = drone.currentMotorThrottle ** 2;
    expect(drone.body.userForce().y).toBeCloseTo(expectedThrust);

    const beforeCut = drone.currentMotorThrottle;
    drone.applyThrottle(0, 0.02);
    expect(drone.currentMotorThrottle).toBeCloseTo(beforeCut * Math.exp(-1));
  });

  it("resets transform, velocities, forces, and motor state", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(world, TEST_CONFIG, {
      position: { x: 1, y: 2, z: 3 },
    });
    drone.body.setLinvel({ x: 1, y: 2, z: 3 }, true);
    drone.body.setAngvel({ x: 3, y: 2, z: 1 }, true);
    drone.body.setTranslation({ x: 8, y: 8, z: 8 }, true);
    drone.applyThrottle(1, 0.1);

    drone.reset();

    expect(drone.body.translation()).toMatchObject({ x: 1, y: 2, z: 3 });
    expect(drone.body.linvel()).toMatchObject({ x: 0, y: 0, z: 0 });
    expect(drone.body.angvel()).toMatchObject({ x: 0, y: 0, z: 0 });
    expect(drone.currentMotorThrottle).toBe(0);
  });
});
