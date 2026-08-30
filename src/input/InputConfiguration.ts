import { MAX_INPUT_DEADBAND, type AxisCalibration } from "./AxisNormalization";
import type { ControlName } from "./InputSource";

export const INPUT_CONFIGURATION_VERSION = 1;
export const INPUT_CONFIGURATION_KEY = "sandfpv.input.v1";

export interface InputConfiguration {
  readonly version: typeof INPUT_CONFIGURATION_VERSION;
  readonly gamepadId: string;
  readonly axes: Record<ControlName, AxisCalibration>;
}

const CONTROLS: readonly ControlName[] = ["throttle", "roll", "pitch", "yaw"];
const DEFAULT_DEADBAND = 0.05;

export function loadInputConfiguration(
  storage: Pick<Storage, "getItem"> = localStorage,
): InputConfiguration | undefined {
  try {
    const value = storage.getItem(INPUT_CONFIGURATION_KEY);
    if (!value) return undefined;
    const parsed = JSON.parse(value) as Partial<InputConfiguration>;
    if (
      parsed.version !== INPUT_CONFIGURATION_VERSION ||
      typeof parsed.gamepadId !== "string" ||
      !parsed.axes ||
      typeof parsed.axes !== "object"
    )
      return undefined;

    const axes = Object.fromEntries(
      CONTROLS.map((control) => {
        const stored = parsed.axes?.[control] as
          Partial<AxisCalibration> | undefined;
        return [
          control,
          stored && {
            ...stored,
            // Early version-1 configurations did not contain a deadband.
            deadband: stored.deadband ?? DEFAULT_DEADBAND,
          },
        ];
      }),
    ) as Record<ControlName, AxisCalibration | undefined>;

    if (CONTROLS.some((control) => !isValidCalibration(axes[control])))
      return undefined;
    return {
      version: INPUT_CONFIGURATION_VERSION,
      gamepadId: parsed.gamepadId,
      axes: axes as Record<ControlName, AxisCalibration>,
    };
  } catch {
    return undefined;
  }
}

function isValidCalibration(
  calibration: AxisCalibration | undefined,
): calibration is AxisCalibration {
  return Boolean(
    calibration &&
    Number.isInteger(calibration.axis) &&
    calibration.axis >= 0 &&
    Number.isFinite(calibration.minimum) &&
    Number.isFinite(calibration.maximum) &&
    Number.isFinite(calibration.center) &&
    calibration.minimum <= calibration.center &&
    calibration.center <= calibration.maximum &&
    calibration.minimum < calibration.maximum &&
    typeof calibration.inverted === "boolean" &&
    Number.isFinite(calibration.deadband) &&
    calibration.deadband >= 0 &&
    calibration.deadband <= MAX_INPUT_DEADBAND,
  );
}

export function saveInputConfiguration(
  configuration: InputConfiguration,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  storage.setItem(INPUT_CONFIGURATION_KEY, JSON.stringify(configuration));
}
