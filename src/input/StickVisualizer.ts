import type { ControlState } from "./InputSource";

export interface StickPosition {
  readonly x: number;
  readonly y: number;
}

export function stickPositions(controls: ControlState): {
  readonly left: StickPosition;
  readonly right: StickPosition;
} {
  return {
    left: { x: -controls.yaw, y: 1 - controls.throttle * 2 },
    right: { x: -controls.roll, y: controls.pitch },
  };
}
