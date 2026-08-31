export interface BoxPlacement {
  readonly position: readonly [number, number, number];
  readonly size: readonly [number, number, number];
  readonly color: number;
}

export interface GatePlacement {
  readonly id: number;
  readonly position: readonly [number, number, number];
  readonly yaw: number;
  readonly width: number;
  readonly height: number;
}

export const HALL_WIDTH = 108;
export const HALL_DEPTH = 72;
export const HALL_HEIGHT = 12;

export const HALL_BOXES: readonly BoxPlacement[] = [
  {
    position: [0, -0.1, 0],
    size: [HALL_WIDTH, 0.2, HALL_DEPTH],
    color: 0x303943,
  },
  {
    position: [0, HALL_HEIGHT + 0.1, 0],
    size: [HALL_WIDTH, 0.2, HALL_DEPTH],
    color: 0x1b232c,
  },
  {
    position: [-HALL_WIDTH / 2 - 0.1, HALL_HEIGHT / 2, 0],
    size: [0.2, HALL_HEIGHT, HALL_DEPTH],
    color: 0x4b5660,
  },
  {
    position: [HALL_WIDTH / 2 + 0.1, HALL_HEIGHT / 2, 0],
    size: [0.2, HALL_HEIGHT, HALL_DEPTH],
    color: 0x4b5660,
  },
  {
    position: [0, HALL_HEIGHT / 2, -HALL_DEPTH / 2 - 0.1],
    size: [HALL_WIDTH, HALL_HEIGHT, 0.2],
    color: 0x414c57,
  },
  {
    position: [0, HALL_HEIGHT / 2, HALL_DEPTH / 2 + 0.1],
    size: [HALL_WIDTH, HALL_HEIGHT, 0.2],
    color: 0x414c57,
  },
];

export const OBSTACLES: readonly BoxPlacement[] = [
  { position: [-25, 1, 12], size: [2, 2, 2], color: 0xd3852f },
  { position: [24, 1, 8], size: [2.5, 2, 2.5], color: 0x3d8791 },
  { position: [0, 0.75, -10], size: [7, 1.5, 1], color: 0xd3852f },
  { position: [-38, 2.5, -19], size: [1.5, 5, 1.5], color: 0x3d8791 },
  { position: [39, 2, -21], size: [1.8, 4, 1.8], color: 0xd3852f },
];

export const GATES: readonly GatePlacement[] = [
  { id: 1, position: [0, 2.4, 25], yaw: 0, width: 4.4, height: 3.8 },
  {
    id: 2,
    position: [-38, 3.1, 11],
    yaw: Math.PI / 2,
    width: 4,
    height: 4.2,
  },
  { id: 3, position: [-24, 4.2, -25], yaw: 0, width: 4.6, height: 3.8 },
  {
    id: 4,
    position: [31, 2.5, -23],
    yaw: -Math.PI / 5,
    width: 4.2,
    height: 3.8,
  },
  {
    id: 5,
    position: [40, 3.4, 14],
    yaw: Math.PI / 2,
    width: 4.4,
    height: 4,
  },
];
