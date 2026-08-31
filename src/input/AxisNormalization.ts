export interface AxisCalibration {
  readonly axis: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly center: number;
  readonly inverted: boolean;
  readonly deadband: number;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

/** Normalize a centered stick to -1..1, retaining full travel after deadband. */
export function normalizeCenteredAxis(
  value: number,
  calibration: AxisCalibration,
): number {
  const range =
    value < calibration.center
      ? calibration.center - calibration.minimum
      : calibration.maximum - calibration.center;
  let normalized = range > 0 ? (value - calibration.center) / range : 0;
  normalized = clamp(normalized, -1, 1);
  if (calibration.inverted) normalized = -normalized;

  const deadband = clamp(calibration.deadband, 0, 0.99);
  const magnitude = Math.abs(normalized);
  if (magnitude <= deadband) return 0;
  return Math.sign(normalized) * ((magnitude - deadband) / (1 - deadband));
}

/** Normalize throttle to 0..1; deadband is applied at its minimum endpoint. */
export function normalizeThrottleAxis(
  value: number,
  calibration: AxisCalibration,
): number {
  const span = calibration.maximum - calibration.minimum;
  let normalized = span > 0 ? (value - calibration.minimum) / span : 0;
  normalized = clamp(normalized, 0, 1);
  if (calibration.inverted) normalized = 1 - normalized;

  const deadband = clamp(calibration.deadband, 0, 0.99);
  if (normalized <= deadband) return 0;
  return (normalized - deadband) / (1 - deadband);
}
