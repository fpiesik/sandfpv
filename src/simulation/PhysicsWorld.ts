import RAPIER from "@dimforge/rapier3d-compat";
import { Drone } from "./Drone";
import { loadDroneConfiguration } from "./DroneConfiguration";
import { createCourseColliders } from "./CourseColliders";

export async function createPhysicsWorld(): Promise<{
  world: RAPIER.World;
  drone: Drone;
  eventQueue: RAPIER.EventQueue;
  gateByCollider: ReadonlyMap<number, number>;
}> {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const eventQueue = new RAPIER.EventQueue(true);
  const { gateByCollider } = createCourseColliders(world);
  const drone = new Drone(world, loadDroneConfiguration());
  return { world, drone, eventQueue, gateByCollider };
}
