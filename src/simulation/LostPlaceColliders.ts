import RAPIER from "@dimforge/rapier3d-compat";
import { lostPlaceStructures } from "../world/LostPlace";

export function createLostPlaceColliders(world: RAPIER.World): {
  setEnabled(enabled: boolean): void;
} {
  const colliders = lostPlaceStructures.map((part) =>
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        ...(part.size.map((size) => size / 2) as [number, number, number]),
      )
        .setTranslation(...part.position)
        .setRotation({
          x: 0,
          y: Math.sin((part.yaw ?? 0) / 2),
          z: 0,
          w: Math.cos((part.yaw ?? 0) / 2),
        }),
    ),
  );
  const setEnabled = (enabled: boolean): void => {
    colliders.forEach((collider) => collider.setEnabled(enabled));
  };
  setEnabled(false);
  return { setEnabled };
}
