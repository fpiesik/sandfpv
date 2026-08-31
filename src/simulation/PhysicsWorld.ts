import RAPIER from "@dimforge/rapier3d-compat";
import { Drone } from "./Drone";
import { loadDroneConfiguration } from "./DroneConfiguration";

export async function createPhysicsWorld(): Promise<{
  world: RAPIER.World;
  drone: Drone;
}> {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(20, 0.1, 20).setTranslation(0, -0.1, 0),
  );

  const drone = new Drone(world, loadDroneConfiguration());
  return { world, drone };
}
