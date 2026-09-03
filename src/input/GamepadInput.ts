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
  private deadband = 0;

  constructor(
    private readonly manager: GamepadManager,
    private configuration?: InputConfiguration,
  ) {}

  setConfiguration(configuration: InputConfiguration): void {
    this.configuration = configuration;
  }

  setDeadband(deadband: number): void {
    this.deadband = Math.min(0.25, Math.max(0, deadband));
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
      roll: applyDeadband(
        normalizeCenteredAxis(raw("roll"), calibration.roll),
        this.deadband,
      ),
      pitch: applyDeadband(
        normalizeCenteredAxis(raw("pitch"), calibration.pitch),
        this.deadband,
      ),
      yaw: applyDeadband(
        normalizeCenteredAxis(raw("yaw"), calibration.yaw),
        this.deadband,
      ),
      reset:
        this.configuration.resetButton !== undefined
          ? (gamepad.buttons[this.configuration.resetButton]?.pressed ?? false)
          : false,
    };
  }
}

export function applyDeadband(value: number, deadband: number): number {
  const magnitude = Math.abs(value);
  if (magnitude <= deadband) return 0;
  return (Math.sign(value) * (magnitude - deadband)) / (1 - deadband);
}
