import RAPIER from "@dimforge/rapier3d-compat";
import { beforeAll, describe, expect, it } from "vitest";
import { Drone } from "./Drone";
import { AIR65_II_RACING } from "./DronePresets";

const DT = 1 / 120;

beforeAll(async () => RAPIER.init());

function step(
  world: RAPIER.World,
  drone: Drone,
  roll: number,
  count: number,
): void {
  for (let index = 0; index < count; index += 1) {
    drone.update(0, DT, { roll, pitch: 0, yaw: 0 });
    world.step();
  }
}

describe("Air65 II Racing flight dynamics", () => {
  it("derives high thrust authority and a low hover motor output", () => {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    const drone = new Drone(world, AIR65_II_RACING);

    expect(drone.maxThrustNewton).toBeCloseTo(1.348875);
    expect(1 / AIR65_II_RACING.thrustToWeightRatio).toBeLessThan(0.2);
  });

  it("tracks a roll step rapidly at the fixed 120 Hz timestep", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    world.timestep = DT;
    const drone = new Drone(world, AIR65_II_RACING);

    step(world, drone, 1, 8);

    expect(drone.flightControllerDebug.actualRates.x).toBeGreaterThan(
      drone.flightControllerDebug.desiredRates.x * 0.65,
    );
  });

  it("actively brakes and reverses a fast roll", () => {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    world.timestep = DT;
    const drone = new Drone(world, AIR65_II_RACING);
    step(world, drone, 1, 8);
    const forwardRate = drone.body.angvel().x;

    step(world, drone, -1, 8);

    expect(forwardRate).toBeGreaterThan(0);
    expect(drone.body.angvel().x).toBeLessThan(0);
  });
});
