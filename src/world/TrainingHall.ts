export const HALL_SIZE = 40;
export const HALL_HEIGHT = HALL_SIZE;

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
  { position: [0, -0.1, 0], size: [40, 0.2, 40], color: 0x59636b },
  { position: [0, 40.1, 0], size: [40, 0.2, 40], color: 0x30373d },
  { position: [0, 20, -20.1], size: [40, 40, 0.2], color: 0x46515a },
  { position: [0, 20, 20.1], size: [40, 40, 0.2], color: 0x46515a },
  { position: [-20.1, 20, 0], size: [0.2, 40, 40], color: 0x3c474f },
  { position: [20.1, 20, 0], size: [0.2, 40, 40], color: 0x3c474f },
];

export const obstacles: readonly BoxDefinition[] = [
  { position: [-6, 1, -3], size: [3, 2, 3], color: 0xd38b35 },
  { position: [4, 0.75, -9], size: [5, 1.5, 1.5], yaw: 0.35, color: 0x68a6a0 },
  { position: [10, 2, 2], size: [1.2, 4, 5], color: 0xc55a4c },
  { position: [-11, 1.5, 8], size: [4, 3, 1.2], yaw: -0.45, color: 0x7788b8 },
  { position: [1, 0.5, 10], size: [7, 1, 2], color: 0xd8b64c },
  { position: [14, 3, -12], size: [1, 6, 1], color: 0x7f9299 },
];

/** Ordered clockwise lap. Gate position is the centre of its opening. */
export const gates: readonly GateDefinition[] = [
  { position: [0, 2.2, -6], yaw: 0, color: 0xffb000 },
  { position: [9, 3.2, -7], yaw: Math.PI / 2, color: 0xff5f57 },
  { position: [12, 2.4, 7], yaw: Math.PI / 4, color: 0x4dd6a7 },
  { position: [0, 4.5, 13], yaw: Math.PI / 2, color: 0x67a8ff },
  { position: [-12, 2.7, 4], yaw: -Math.PI / 4, color: 0xcb72ff },
];

export const GATE_OPENING = { width: 3, height: 2.5 } as const;
export const GATE_BAR_THICKNESS = 0.28;
