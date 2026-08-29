import {
  normalizeCenteredAxis,
  normalizeThrottleAxis,
} from "./AxisNormalization";
import type { InputConfiguration } from "./InputConfiguration";
import {
  NEUTRAL_CONTROLS,
  type ControlState,
  type InputSource,
} from "./InputSource";
import type { GamepadManager } from "./GamepadManager";

export class GamepadInput implements InputSource {
  readonly id = "gamepad";

  constructor(
    private readonly manager: GamepadManager,
    private configuration?: InputConfiguration,
  ) {}

  setConfiguration(configuration: InputConfiguration): void {
    this.configuration = configuration;
  }

  update(): void {
    this.manager.update();
  }

  read(): ControlState {
    if (!this.configuration) return NEUTRAL_CONTROLS;
    const gamepad = this.manager.connectedGamepads.find(
      ({ id }) => id === this.configuration?.gamepadId,
    );
    if (!gamepad) return NEUTRAL_CONTROLS;
    const { axes } = this.configuration;
    const raw = (name: keyof typeof axes): number =>
      gamepad.axes[axes[name].axis] ?? axes[name].center;
    return {
      throttle: normalizeThrottleAxis(raw("throttle"), axes.throttle),
      roll: normalizeCenteredAxis(raw("roll"), axes.roll),
      pitch: normalizeCenteredAxis(raw("pitch"), axes.pitch),
      yaw: normalizeCenteredAxis(raw("yaw"), axes.yaw),
    };
  }
}
