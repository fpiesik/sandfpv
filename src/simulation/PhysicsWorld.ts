import RAPIER from "@dimforge/rapier3d-compat";
import { Drone, type DroneConfig } from "./Drone";
import { createTrainingHallColliders } from "./TrainingHallColliders";
import { createLostPlaceColliders } from "./LostPlaceColliders";
import type { FlightEnvironment } from "../render/Scene";

export async function createPhysicsWorld(config?: DroneConfig): Promise<{
  world: RAPIER.World;
  drone: Drone;
  gateSensors: readonly RAPIER.Collider[];
  setGateSize(scale: number): void;
  setEnvironment(environment: FlightEnvironment): void;
}> {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const hall = createTrainingHallColliders(world);
  const lostPlace = createLostPlaceColliders(world);
  const setEnvironment = (environment: FlightEnvironment): void => {
    const lostPlaceActive = environment === "lost-place";
    hall.setEnabled(!lostPlaceActive);
    lostPlace.setEnabled(lostPlaceActive);
  };

  return {
    world,
    drone: new Drone(world, config),
    gateSensors: hall.gateSensors,
    setGateSize: hall.setGateSize,
    setEnvironment,
  };
}
