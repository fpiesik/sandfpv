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
  setGateSize(scale: number): void;
}

/** Builds static Rapier geometry without knowing anything about rendering. */
export function createTrainingHallColliders(
  world: RAPIER.World,
): TrainingHallColliders {
  for (const box of [...hallSurfaces, ...obstacles]) createBox(world, box);

  const gateFrames: RAPIER.Collider[][] = [];
  const gateSensors = gates.map((gate) => {
    const [x, y, z] = gate.position;
    const rotation = {
      x: 0,
      y: Math.sin(gate.yaw / 2),
      z: 0,
      w: Math.cos(gate.yaw / 2),
    };
    gateFrames.push(
      Array.from({ length: 4 }, () =>
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(0.01, 0.01, 0.01).setRotation(rotation),
        ),
      ),
    );
    return world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.01, 0.01, 0.12)
        .setTranslation(x, y, z)
        .setRotation(rotation)
        .setSensor(true),
    );
  });
  const setGateSize = (scale: number): void => {
    gates.forEach((gate, gateIndex) => {
      const [x, y, z] = gate.position;
      const openingWidth = GATE_OPENING.width * scale;
      const openingHeight = GATE_OPENING.height * scale;
      const barThickness = GATE_BAR_THICKNESS * scale;
      const frameParts: Array<{
        offset: [number, number];
        size: [number, number, number];
      }> = [
        {
          offset: [-openingWidth / 2, 0],
          size: [barThickness, openingHeight + barThickness * 2, barThickness],
        },
        {
          offset: [openingWidth / 2, 0],
          size: [barThickness, openingHeight + barThickness * 2, barThickness],
        },
        {
          offset: [0, -openingHeight / 2],
          size: [openingWidth, barThickness, barThickness],
        },
        {
          offset: [0, openingHeight / 2],
          size: [openingWidth, barThickness, barThickness],
        },
      ];
      frameParts.forEach((part, partIndex) => {
        const localX = part.offset[0];
        const collider = gateFrames[gateIndex][partIndex];
        collider.setShape(
          new RAPIER.Cuboid(
            ...(part.size.map((size) => size / 2) as [number, number, number]),
          ),
        );
        collider.setTranslation({
          x: x + localX * Math.cos(gate.yaw),
          y: y + part.offset[1],
          z: z - localX * Math.sin(gate.yaw),
        });
      });
      gateSensors[gateIndex].setShape(
        new RAPIER.Cuboid(openingWidth / 2, openingHeight / 2, 0.12),
      );
    });
  };
  setGateSize(1);
  return { gateSensors, setGateSize };
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
