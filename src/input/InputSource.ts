export const INPUT_CHANNEL_COUNT = 16;

export type ControlName = "throttle" | "roll" | "pitch" | "yaw";

export interface ControlState {
  readonly throttle: number;
  readonly roll: number;
  readonly pitch: number;
  readonly yaw: number;
}

/** Device-independent source of the four flight controls. */
export interface InputSource {
  readonly id: string;
  update(): void;
  read(): ControlState;
  destroy?(): void;
}

export const NEUTRAL_CONTROLS: ControlState = {
  throttle: 0,
  roll: 0,
  pitch: 0,
  yaw: 0,
};
