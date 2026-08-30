import RAPIER from "@dimforge/rapier3d-compat";
import type { GatePlacement } from "../course/CourseLayout";
import { GATES, HALL_BOXES, OBSTACLES } from "../course/CourseLayout";

export interface CourseCollisionData {
  readonly gateByCollider: ReadonlyMap<number, number>;
}

/** Builds the static physical course independently of its visual counterpart. */
export function createCourseColliders(
  world: RAPIER.World,
): CourseCollisionData {
  // The floor used to be a 108 m x 72 m x 0.2 m cuboid. That extreme size
  // difference relative to the 65 mm drone makes ground contacts needlessly
  // ill-conditioned. A half-space describes the same y=0 collision surface
  // without edges or a thin volume for the drone to penetrate.
  world.createCollider(
    new RAPIER.ColliderDesc(
      new RAPIER.HalfSpace({ x: 0, y: 1, z: 0 }),
    ).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
  );

  for (const box of [...HALL_BOXES.slice(1), ...OBSTACLES]) {
    const [x, y, z] = box.position;
    const [width, height, depth] = box.size;
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
        .setTranslation(x, y, z)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    );
  }

  const gateByCollider = new Map<number, number>();
  for (const gate of GATES) {
    addGateFrame(world, gate);
    const [x, y, z] = gate.position;
    const sensor = world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        gate.width / 2 - 0.18,
        gate.height / 2 - 0.18,
        0.12,
      )
        .setTranslation(x, y, z)
        .setRotation(yawRotation(gate.yaw))
        .setSensor(true)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    );
    gateByCollider.set(sensor.handle, gate.id);
  }
  return { gateByCollider };
}

function addGateFrame(world: RAPIER.World, gate: GatePlacement): void {
  const thickness = 0.22;
  const depth = 0.35;
  const [x, y, z] = gate.position;
  const rotation = yawRotation(gate.yaw);
  const parts: readonly (readonly [number, number, number, number, number])[] =
    [
      [-gate.width / 2, 0, thickness, gate.height + thickness, depth],
      [gate.width / 2, 0, thickness, gate.height + thickness, depth],
      [0, gate.height / 2, gate.width + thickness, thickness, depth],
      [0, -gate.height / 2, gate.width + thickness, thickness, depth],
    ];
  for (const [localX, localY, width, height, partDepth] of parts) {
    const rotatedX = localX * Math.cos(gate.yaw);
    const rotatedZ = -localX * Math.sin(gate.yaw);
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(width / 2, height / 2, partDepth / 2)
        .setTranslation(x + rotatedX, y + localY, z + rotatedZ)
        .setRotation(rotation)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    );
  }
}

function yawRotation(yaw: number): RAPIER.Rotation {
  return { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) };
}
