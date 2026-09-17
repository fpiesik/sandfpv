import type { BoxDefinition } from "./TrainingHall";

export const LOST_PLACE_ATMOSPHERE = 0x171c1b;

const concrete = 0x414541;
const darkConcrete = 0x292e2c;
const rust = 0x653c2a;
const steel = 0x343b3a;
const moss = 0x35483a;

const box = (
  position: readonly [number, number, number],
  size: readonly [number, number, number],
  color = concrete,
  yaw?: number,
): BoxDefinition => ({ position, size, color, yaw });

/**
 * Modular, low-poly collision and render pieces for the abandoned works.
 * Walls are assembled around real openings instead of hiding holes behind
 * invisible colliders, so every visible route is physically flyable.
 */
export const lostPlaceStructures: readonly BoxDefinition[] = [
  // Overgrown exterior yard and the main factory's broken ground floor.
  box([0, -0.25, 0], [64, 0.5, 72], 0x2d3630),
  box([0, 0.02, 0], [34, 0.12, 48], darkConcrete),
  box([-16.8, 4, 0], [0.55, 8, 48], concrete),
  box([16.8, 4, -17], [0.55, 8, 14], concrete),
  box([16.8, 4, 0], [0.55, 8, 10], concrete),
  box([16.8, 4, 18], [0.55, 8, 12], concrete),
  box([16.8, 1, -8.5], [0.55, 2, 3], concrete),
  box([16.8, 6.6, -8.5], [0.55, 2.8, 3], concrete),
  box([16.8, 1, 8], [0.55, 2, 6], concrete),
  box([16.8, 6.6, 8], [0.55, 2.8, 6], concrete),
  // End walls contain broad doors plus smaller, more technical window lines.
  box([-11, 4, -24], [11, 8, 0.55], concrete),
  box([11, 4, -24], [11, 8, 0.55], concrete),
  box([0, 6.8, -24], [11, 2.4, 0.55], concrete),
  box([-12, 4, 24], [9, 8, 0.55], concrete),
  box([12, 4, 24], [9, 8, 0.55], concrete),
  box([0, 1, 24], [15, 2, 0.55], concrete),
  box([0, 7, 24], [15, 2, 0.55], concrete),
  // Upper shell: broken wall bands retain large diveable windows.
  ...[-12, -4, 4, 12].flatMap((z) => [
    box([-16.8, 10.5, z], [0.55, 2.2, 5], concrete),
    box([16.8, 10.5, z], [0.55, 2.2, 5], concrete),
  ]),
  box([-16.8, 8.4, 0], [0.55, 1.3, 48], darkConcrete),
  box([16.8, 8.4, 0], [0.55, 1.3, 48], darkConcrete),
  box([-16.8, 13.4, 0], [0.55, 1.2, 48], darkConcrete),
  box([16.8, 13.4, 0], [0.55, 1.2, 48], darkConcrete),
  // Two partial storeys with generous central transfer holes.
  box([-10.5, 7.8, 0], [12, 0.38, 46], concrete),
  box([11.5, 7.8, -15], [10, 0.38, 16], concrete),
  box([11.5, 7.8, 15], [10, 0.38, 16], concrete),
  box([-11.5, 12.8, -14], [9, 0.35, 18], darkConcrete),
  box([-11.5, 12.8, 14], [9, 0.35, 18], darkConcrete),
  box([5, 12.8, -19], [22, 0.35, 8], darkConcrete),
  // Columns and steel skeleton make both fast aisles and precision slaloms.
  ...[-12, 0, 12].flatMap((x) =>
    [-18, -6, 6, 18].map((z) => box([x, 6.5, z], [0.55, 13, 0.55], steel)),
  ),
  ...[-18, -6, 6, 18].map((z) => box([0, 14.4, z], [34, 0.35, 0.35], rust)),
  box([0, 14.4, -2], [0.35, 0.35, 44], rust),
  // Fallen beams and old machinery create optional low, narrow lines.
  box([-5, 1.1, -9], [8, 0.35, 0.45], rust, 0.28),
  box([5, 2.5, 4], [0.4, 5, 0.4], rust, -0.25),
  box([-1, 0.8, 14], [4.2, 1.6, 2.8], 0x303736),
  box([-1, 1.8, 14], [2.6, 0.35, 2.2], rust),
  box([-8, 0.6, 4], [3.5, 1.2, 1.8], 0x303736),
  box([8, 0.35, -2], [7, 0.22, 0.22], rust, -0.45),
  // Vertical shaft: four open corners, staggered broken platforms and beams.
  ...([-1, 1] as const).flatMap((x) =>
    ([-1, 1] as const).map((z) =>
      box([10 + x * 3.1, 12, -13 + z * 3.1], [0.55, 24, 0.55], steel),
    ),
  ),
  box([10, 5, -15.8], [6.7, 0.3, 1], rust),
  box([12.7, 9, -13], [1.2, 0.3, 5], rust),
  box([8.2, 13, -13], [2.5, 0.3, 4.5], rust),
  box([10, 17, -11], [5.5, 0.3, 1.2], rust),
  box([10, 21, -13], [0.35, 0.35, 6.4], rust, 0.6),
  // Exterior concrete fragments, fence posts, tanks and shortcut frames.
  box([-24, 1.4, -13], [0.5, 2.8, 17], concrete, 0.12),
  box([-24, 1.4, 14], [0.5, 2.8, 12], concrete, -0.08),
  box([-23, 3, 2], [0.35, 6, 0.35], rust),
  box([-23, 5.8, 2], [0.35, 0.35, 7], rust),
  box([23, 1.5, 10], [4, 3, 4], steel),
  box([23, 3.4, 10], [4.5, 0.35, 4.5], rust),
  box([22, 0.8, -14], [8, 1.6, 0.5], moss, -0.22),
  ...[-28, -24, -20, 20, 24, 28].map((x) =>
    box([x, 1.3, 27], [0.16, 2.6, 0.16], rust),
  ),
];

/** Non-colliding visual ground patches; kept separate from flight obstacles. */
export const lostPlaceMoss: readonly BoxDefinition[] = [
  box([-21, 0.04, -20], [8, 0.05, 12], moss, 0.2),
  box([23, 0.04, 21], [11, 0.05, 8], moss, -0.3),
  box([-9, 0.1, 18], [3, 0.06, 5], moss, 0.15),
];
