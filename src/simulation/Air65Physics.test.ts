import RAPIER from "@dimforge/rapier3d-compat";
import { beforeAll, describe, expect, it } from "vitest";
import { FixedTimestep } from "../core/FixedTimestep";
import { AIR65_II_FREESTYLE_CONFIG as profile } from "./Air65Profile";
import { Drone } from "./Drone";

beforeAll(async () => RAPIER.init());

function simulate(frameRate: number, seconds: number, throttle: number) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const drone = new Drone(world, profile, { position: { x: 0, y: 50, z: 0 } });
  const fixed = new FixedTimestep(240);
  for (let frame = 0; frame < frameRate * seconds; frame++)
    fixed.advance(1 / frameRate, (dt) => {
      drone.applyThrottle(throttle, dt);
      world.timestep = dt;
      world.step();
    });
  return { velocity: drone.body.linvel(), telemetry: drone.telemetry };
}

describe("Air65 II physical consistency", () => {
  it("derives hover where steady thrust equals weight", () => {
    const hover =
      ((profile.mass * 9.81) / profile.maxThrust) **
      (1 / profile.thrustExponent);
    expect(hover).toBeGreaterThan(0.35);
    expect(hover).toBeLessThan(0.5);
    expect(profile.maxThrust * hover ** profile.thrustExponent).toBeCloseTo(
      profile.mass * 9.81,
      8,
    );
  });

  it("responds to a full-throttle step without instantaneous spool-up", () => {
    const result = simulate(60, 0.1, 1);
    expect(result.telemetry.motorSpeeds[0]).toBeGreaterThan(0.9);
    expect(result.velocity.y).toBeGreaterThan(1);
  });

  it.each([30, 60, 144])("is invariant at %i render FPS", (fps) => {
    const reference = simulate(60, 1, 0.55);
    const result = simulate(fps, 1, 0.55);
    expect(result.velocity.y).toBeCloseTo(reference.velocity.y, 5);
    expect(result.telemetry.stateOfCharge).toBeCloseTo(
      reference.telemetry.stateOfCharge,
      5,
    );
  });

  it("produces lower loaded voltage after sustained full power", () => {
    const partial = simulate(60, 1, 0.35).telemetry;
    const full = simulate(60, 1, 1).telemetry;
    expect(full.batteryVoltage).toBeLessThan(partial.batteryVoltage);
    expect(full.stateOfCharge).toBeLessThan(partial.stateOfCharge);
  });

  it("creates roll/pitch lever torque and yaw reaction torque per motor", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(world, profile);
    drone.stepMotorCommands([1, 0.2, 0.2, 1], 1 / 240);
    const rollPitchTorque = drone.body.userTorque();
    expect(Math.hypot(rollPitchTorque.x, rollPitchTorque.z)).toBeGreaterThan(0);
    drone.stepMotorCommands([1, 0.2, 1, 0.2], 1 / 240);
    expect(Math.abs(drone.body.userTorque().y)).toBeGreaterThan(0);
  });

  it("spools down after a throttle cut and applies opposing forward drag", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const drone = new Drone(world, profile);
    drone.applyThrottle(1, 0.1);
    const beforeCut = drone.currentMotorThrottle;
    drone.body.setLinvel({ x: 5, y: 0, z: 0 }, true);
    drone.applyThrottle(0, 1 / 240);
    expect(drone.currentMotorThrottle).toBeLessThan(beforeCut);
    expect(drone.currentMotorThrottle).toBeGreaterThan(0);
    expect(drone.body.userForce().x).toBeLessThan(0);
  });
});
