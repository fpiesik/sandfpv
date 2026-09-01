import RAPIER from "@dimforge/rapier3d-compat";
import { Drone, type DroneConfig } from "./Drone";
import { createTrainingHallColliders } from "./TrainingHallColliders";

export async function createPhysicsWorld(config?: DroneConfig): Promise<{
  world: RAPIER.World;
  drone: Drone;
  gateSensors: readonly RAPIER.Collider[];
  setGateSize(scale: number): void;
}> {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const { gateSensors, setGateSize } = createTrainingHallColliders(world);

  return { world, drone: new Drone(world, config), gateSensors, setGateSize };
}
