import type { AxisCalibration } from "./AxisNormalization";
import type { ControlName } from "./InputSource";

export const INPUT_CONFIGURATION_VERSION = 1;
export const INPUT_CONFIGURATION_KEY = "sandfpv.input.v1";

export interface InputConfiguration {
  readonly version: typeof INPUT_CONFIGURATION_VERSION;
  readonly gamepadId: string;
  readonly axes: Record<ControlName, AxisCalibration>;
}

export function loadInputConfiguration(
  storage: Pick<Storage, "getItem"> = localStorage,
): InputConfiguration | undefined {
  try {
    const raw = storage.getItem(INPUT_CONFIGURATION_KEY);
    if (!raw) return undefined;
    const value = JSON.parse(raw) as Partial<InputConfiguration>;
    if (
      value.version !== INPUT_CONFIGURATION_VERSION ||
      typeof value.gamepadId !== "string" ||
      !value.axes ||
      !["throttle", "yaw", "pitch", "roll"].every((name) => {
        const axis = value.axes?.[name as ControlName];
        return (
          axis &&
          Number.isInteger(axis.axis) &&
          Number.isFinite(axis.minimum) &&
          Number.isFinite(axis.maximum) &&
          Number.isFinite(axis.center) &&
          typeof axis.inverted === "boolean" &&
          Number.isFinite(axis.deadband)
        );
      })
    )
      return undefined;
    return value as InputConfiguration;
  } catch {
    return undefined;
  }
}

export function saveInputConfiguration(
  configuration: InputConfiguration,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  storage.setItem(INPUT_CONFIGURATION_KEY, JSON.stringify(configuration));
}
