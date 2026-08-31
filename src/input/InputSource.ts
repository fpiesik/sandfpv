export type ControlName = "throttle" | "roll" | "pitch" | "yaw";

export interface ControlState {
  readonly throttle: number;
  readonly roll: number;
  readonly pitch: number;
  readonly yaw: number;
  readonly selfLevel: boolean;
}

/** Device-independent contract consumed by the flight simulation. */
export interface InputSource {
  readonly id: string;
  update(): void;
  read(): ControlState;
}

export const NEUTRAL_CONTROLS: ControlState = {
  throttle: 0,
  roll: 0,
  pitch: 0,
  yaw: 0,
  selfLevel: false,
};
