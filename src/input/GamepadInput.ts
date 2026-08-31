import {
  normalizeCenteredAxis,
  normalizeThrottleAxis,
} from "./AxisNormalization";
import type { GamepadManager } from "./GamepadManager";
import type { InputConfiguration } from "./InputConfiguration";
import {
  NEUTRAL_CONTROLS,
  type ControlName,
  type ControlState,
  type InputSource,
} from "./InputSource";

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
    const calibration = this.configuration.axes;
    const raw = (name: ControlName): number =>
      gamepad.axes[calibration[name].axis] ?? calibration[name].center;
    return {
      throttle: normalizeThrottleAxis(raw("throttle"), calibration.throttle),
      roll: normalizeCenteredAxis(raw("roll"), calibration.roll),
      pitch: normalizeCenteredAxis(raw("pitch"), calibration.pitch),
      yaw: normalizeCenteredAxis(raw("yaw"), calibration.yaw),
      selfLevel:
        gamepad.buttons[this.configuration.selfLevelButton]?.pressed ?? false,
    };
  }
}
