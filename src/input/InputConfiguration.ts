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
    const value = storage.getItem(INPUT_CONFIGURATION_KEY);
    if (!value) return undefined;
    const parsed = JSON.parse(value) as Partial<InputConfiguration>;
    if (
      parsed.version !== INPUT_CONFIGURATION_VERSION ||
      typeof parsed.gamepadId !== "string" ||
      !parsed.axes
    )
      return undefined;
    return parsed as InputConfiguration;
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
