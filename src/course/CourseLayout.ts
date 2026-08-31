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

export const HALL_BOXES: readonly BoxPlacement[] = [
  { position: [0, -0.1, 0], size: [36, 0.2, 24], color: 0x303943 },
  { position: [0, 8.1, 0], size: [36, 0.2, 24], color: 0x1b232c },
  { position: [-18.1, 4, 0], size: [0.2, 8, 24], color: 0x4b5660 },
  { position: [18.1, 4, 0], size: [0.2, 8, 24], color: 0x4b5660 },
  { position: [0, 4, -12.1], size: [36, 8, 0.2], color: 0x414c57 },
  { position: [0, 4, 12.1], size: [36, 8, 0.2], color: 0x414c57 },
];

export const OBSTACLES: readonly BoxPlacement[] = [
  { position: [-7, 1, 3], size: [2, 2, 2], color: 0xd3852f },
  { position: [7, 1, 1], size: [2.5, 2, 2.5], color: 0x3d8791 },
  { position: [0, 0.75, -2], size: [5, 1.5, 1], color: 0xd3852f },
  { position: [-11, 2, -6], size: [1.2, 4, 1.2], color: 0x3d8791 },
  { position: [11, 1.5, -7], size: [1.5, 3, 1.5], color: 0xd3852f },
];

export const GATES: readonly GatePlacement[] = [
  { id: 1, position: [0, 2.2, 6], yaw: 0, width: 4, height: 3.4 },
  { id: 2, position: [-9, 2.5, 1], yaw: Math.PI / 2, width: 3.6, height: 3.8 },
  { id: 3, position: [0, 3.6, -5], yaw: 0, width: 4.2, height: 3.4 },
  { id: 4, position: [10, 2.2, -2], yaw: Math.PI / 2, width: 3.6, height: 3.4 },
  { id: 5, position: [5, 2.8, 7], yaw: Math.PI / 4, width: 4, height: 3.6 },
];
