import RAPIER from "@dimforge/rapier3d-compat";

export interface PhysicsBody {
  body: RAPIER.RigidBody;
}

export async function createPhysicsWorld(): Promise<{
  world: RAPIER.World;
  cube: PhysicsBody;
}> {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(20, 0.1, 20).setTranslation(0, -0.1, 0),
  );

  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 5, 0)
      .setRotation({ x: 0.2, y: 0, z: 0.1, w: 0.97 }),
  );
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5), body);
  return { world, cube: { body } };
}
