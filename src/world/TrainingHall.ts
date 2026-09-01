/** Standard German triple sports hall dimensions, in metres. */
export const HALL_WIDTH = 27;
export const HALL_DEPTH = 45;
export const HALL_HEIGHT = 9;

export interface BoxDefinition {
  readonly position: readonly [number, number, number];
  readonly size: readonly [number, number, number];
  readonly yaw?: number;
  readonly color: number;
}

export interface GateDefinition {
  readonly position: readonly [number, number, number];
  readonly yaw: number;
  readonly color: number;
}

export const hallSurfaces: readonly BoxDefinition[] = [
  {
    position: [0, -0.1, 0],
    size: [HALL_WIDTH, 0.2, HALL_DEPTH],
    color: 0x59636b,
  },
  {
    position: [0, HALL_HEIGHT + 0.1, 0],
    size: [HALL_WIDTH, 0.2, HALL_DEPTH],
    color: 0x30373d,
  },
  {
    position: [0, HALL_HEIGHT / 2, -HALL_DEPTH / 2 - 0.1],
    size: [HALL_WIDTH, HALL_HEIGHT, 0.2],
    color: 0x46515a,
  },
  {
    position: [0, HALL_HEIGHT / 2, HALL_DEPTH / 2 + 0.1],
    size: [HALL_WIDTH, HALL_HEIGHT, 0.2],
    color: 0x46515a,
  },
  {
    position: [-HALL_WIDTH / 2 - 0.1, HALL_HEIGHT / 2, 0],
    size: [0.2, HALL_HEIGHT, HALL_DEPTH],
    color: 0x3c474f,
  },
  {
    position: [HALL_WIDTH / 2 + 0.1, HALL_HEIGHT / 2, 0],
    size: [0.2, HALL_HEIGHT, HALL_DEPTH],
    color: 0x3c474f,
  },
];

export const obstacles: readonly BoxDefinition[] = [
  { position: [-4.5, 0.3, -5], size: [0.8, 0.6, 0.8], color: 0xd38b35 },
  {
    position: [3, 0.2, -11],
    size: [1.5, 0.4, 0.4],
    yaw: 0.35,
    color: 0x68a6a0,
  },
  { position: [7, 0.7, 1], size: [0.35, 1.4, 1.2], color: 0xc55a4c },
  {
    position: [-7, 0.45, 8],
    size: [1.2, 0.9, 0.3],
    yaw: -0.45,
    color: 0x7788b8,
  },
  { position: [1, 0.15, 13], size: [2, 0.3, 0.6], color: 0xd8b64c },
  { position: [9, 1, -14], size: [0.25, 2, 0.25], color: 0x7f9299 },
];

/**
 * Ordered clockwise lap with broad, flowing turns. Gate position is the centre
 * of its opening; the outermost frame retains safe wall clearance.
 */
export const gates: readonly GateDefinition[] = [
  { position: [0, 2.5, -17], yaw: -Math.PI / 6, color: 0xffb000 },
  { position: [8, 2.5, -9], yaw: Math.PI / 4, color: 0xff5f57 },
  { position: [8.5, 2.5, 7], yaw: 0, color: 0x4dd6a7 },
  { position: [0, 2.5, 17], yaw: -Math.PI / 4, color: 0x67a8ff },
  { position: [-8.5, 2.5, 5], yaw: Math.PI / 4, color: 0xcb72ff },
];

export const GATE_OPENING = { width: 0.8, height: 0.7 } as const;
export const GATE_BAR_THICKNESS = 0.06;
