import RAPIER from "@dimforge/rapier3d-compat";
import {
  GATE_BAR_THICKNESS,
  GATE_OPENING,
  gates,
  hallSurfaces,
  obstacles,
  type BoxDefinition,
} from "../world/TrainingHall";

export interface TrainingHallColliders {
  readonly gateSensors: readonly RAPIER.Collider[];
}

/** Builds static Rapier geometry without knowing anything about rendering. */
export function createTrainingHallColliders(
  world: RAPIER.World,
): TrainingHallColliders {
  for (const box of [...hallSurfaces, ...obstacles]) createBox(world, box);

  const gateSensors = gates.map((gate) => {
    const [x, y, z] = gate.position;
    const rotation = {
      x: 0,
      y: Math.sin(gate.yaw / 2),
      z: 0,
      w: Math.cos(gate.yaw / 2),
    };
    const frameParts: Array<{
      offset: [number, number];
      size: [number, number, number];
    }> = [
      {
        offset: [-GATE_OPENING.width / 2, 0],
        size: [
          GATE_BAR_THICKNESS,
          GATE_OPENING.height + GATE_BAR_THICKNESS * 2,
          GATE_BAR_THICKNESS,
        ],
      },
      {
        offset: [GATE_OPENING.width / 2, 0],
        size: [
          GATE_BAR_THICKNESS,
          GATE_OPENING.height + GATE_BAR_THICKNESS * 2,
          GATE_BAR_THICKNESS,
        ],
      },
      {
        offset: [0, -GATE_OPENING.height / 2],
        size: [GATE_OPENING.width, GATE_BAR_THICKNESS, GATE_BAR_THICKNESS],
      },
      {
        offset: [0, GATE_OPENING.height / 2],
        size: [GATE_OPENING.width, GATE_BAR_THICKNESS, GATE_BAR_THICKNESS],
      },
    ];
    for (const part of frameParts) {
      const localX = part.offset[0];
      const worldX = x + localX * Math.cos(gate.yaw);
      const worldZ = z - localX * Math.sin(gate.yaw);
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          ...(part.size.map((size) => size / 2) as [number, number, number]),
        )
          .setTranslation(worldX, y + part.offset[1], worldZ)
          .setRotation(rotation),
      );
    }
    return world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        GATE_OPENING.width / 2,
        GATE_OPENING.height / 2,
        0.12,
      )
        .setTranslation(x, y, z)
        .setRotation(rotation)
        .setSensor(true),
    );
  });
  return { gateSensors };
}

function createBox(world: RAPIER.World, box: BoxDefinition): void {
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      ...(box.size.map((size) => size / 2) as [number, number, number]),
    )
      .setTranslation(...box.position)
      .setRotation({
        x: 0,
        y: Math.sin((box.yaw ?? 0) / 2),
        z: 0,
        w: Math.cos((box.yaw ?? 0) / 2),
      }),
  );
}
