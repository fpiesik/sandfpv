/** Hall footprint: twice the former X span and three times the former Z span. */
export const HALL_WIDTH = 80;
export const HALL_DEPTH = 120;
export const HALL_HEIGHT = 40;

export interface BoxDefinition {
  readonly position: readonly [number, number, number];
  readonly size: readonly [number, number, number];
  readonly yaw?: number;
  readonly color: number;
}

export interface GateDefinition {
  readonly position: readonly [number, number, number];
  readonly yaw: number;
  /** Uniform scale relative to the original 3 m x 2.5 m gate. */
  readonly scale: number;
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
  { position: [-6, 1, -3], size: [3, 2, 3], color: 0xd38b35 },
  { position: [4, 0.75, -9], size: [5, 1.5, 1.5], yaw: 0.35, color: 0x68a6a0 },
  { position: [10, 2, 2], size: [1.2, 4, 5], color: 0xc55a4c },
  { position: [-11, 1.5, 8], size: [4, 3, 1.2], yaw: -0.45, color: 0x7788b8 },
  { position: [1, 0.5, 10], size: [7, 1, 2], color: 0xd8b64c },
  { position: [14, 3, -12], size: [1, 6, 1], color: 0x7f9299 },
];

/**
 * Ordered clockwise lap with broad, flowing turns. Gate position is the centre
 * of its opening; the outermost frame still has at least 10 m wall clearance.
 */
export const gates: readonly GateDefinition[] = [
  { position: [0, 8, -42], yaw: -Math.PI / 4, scale: 4, color: 0xffb000 },
  { position: [25, 6, -24], yaw: Math.PI / 4, scale: 3, color: 0xff5f57 },
  { position: [26, 4, 18], yaw: 0, scale: 2, color: 0x4dd6a7 },
  { position: [4, 4.5, 43], yaw: -Math.PI / 4, scale: 1, color: 0x67a8ff },
  {
    position: [-27, 2.7, 10],
    yaw: Math.PI / 4,
    scale: 2 / 3,
    color: 0xcb72ff,
  },
];

export const GATE_OPENING = { width: 3, height: 2.5 } as const;
export const GATE_BAR_THICKNESS = 0.28;
