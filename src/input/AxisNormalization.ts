export interface AxisCalibration {
  readonly axis: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly center: number;
  readonly inverted: boolean;
  readonly deadband: number;
}

// A value close to 1 makes almost the entire stick travel unresponsive. Keep
// this limit in the normalization path as well as the UI so legacy persisted
// configurations cannot reintroduce that behaviour.
export const MAX_INPUT_DEADBAND = 0.2;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

/** Normalizes a centered axis and rescales outside the deadband continuously. */
export function normalizeCenteredAxis(
  value: number,
  calibration: AxisCalibration,
): number {
  if (!isFiniteCalibration(value, calibration)) return 0;
  const range =
    value < calibration.center
      ? calibration.center - calibration.minimum
      : calibration.maximum - calibration.center;
  let normalized = range > 0 ? (value - calibration.center) / range : 0;
  normalized = clamp(normalized, -1, 1);
  if (calibration.inverted) normalized = -normalized;

  const deadband = clamp(calibration.deadband, 0, MAX_INPUT_DEADBAND);
  const magnitude = Math.abs(normalized);
  if (magnitude <= deadband) return 0;
  return Math.sign(normalized) * ((magnitude - deadband) / (1 - deadband));
}

/** Normalizes the positive half of a centered throttle axis to 0..1. */
export function normalizeThrottleAxis(
  value: number,
  calibration: AxisCalibration,
): number {
  if (!isFiniteCalibration(value, calibration)) return 0;
  const end = calibration.inverted ? calibration.minimum : calibration.maximum;
  const span = Math.abs(end - calibration.center);
  const direction = calibration.inverted ? -1 : 1;
  const normalized = clamp(
    span > 0 ? ((value - calibration.center) * direction) / span : 0,
    0,
    1,
  );

  const deadband = clamp(calibration.deadband, 0, MAX_INPUT_DEADBAND);
  if (normalized <= deadband) return 0;
  return (normalized - deadband) / (1 - deadband);
}

function isFiniteCalibration(
  value: number,
  calibration: AxisCalibration,
): boolean {
  return [
    value,
    calibration.minimum,
    calibration.maximum,
    calibration.center,
    calibration.deadband,
  ].every(Number.isFinite);
}
