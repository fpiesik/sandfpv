import type RAPIER from "@dimforge/rapier3d-compat";

export interface RateCommand {
  roll: number;
  pitch: number;
  yaw: number;
}

/** Maps a normalized stick value to a rate in rad/s using cubic expo. */
export function applyRateCurve(
  stick: number,
  maxRateDegrees: number,
  expo: number,
): number {
  const input = Math.min(1, Math.max(-1, stick));
  // Expo must not be allowed to suppress the rate command around the center.
  // In a rate controller that suppression is applied once more by the P term,
  // so the previously permitted 0.7 left only 30% of the expected roll/pitch
  // response and felt like a second, physics-side dead zone. Keep at least 80%
  // linear authority; the input deadband remains exclusively an input concern.
  const amount = Math.min(0.2, Math.max(0, expo));
  const shaped = input * (1 - amount) + input * input * input * amount;
  return shaped * maxRateDegrees * (Math.PI / 180);
}

export interface RateControllerTuning {
  rollController: AxisTuning;
  pitchController: AxisTuning;
  yawController: AxisTuning;
  rateIntegralLimit: number;
  maxControlTorque: number;
}

interface AxisTuning {
  kp: number;
  ki: number;
  kd: number;
  feedForward: number;
}

export class RateController {
  private integral: RAPIER.Vector = { x: 0, y: 0, z: 0 };
  private previousActual: RAPIER.Vector = { x: 0, y: 0, z: 0 };
  private previousDesired: RAPIER.Vector = { x: 0, y: 0, z: 0 };

  update(
    desired: RAPIER.Vector,
    actual: RAPIER.Vector,
    deltaSeconds: number,
    tuning: Readonly<RateControllerTuning>,
  ): RAPIER.Vector {
    const dt = Math.max(deltaSeconds, 1e-6);
    const error = subtract(desired, actual);
    this.integral = mapVector(this.integral, (value, axis) =>
      clamp(
        value + error[axis] * dt,
        -tuning.rateIntegralLimit,
        tuning.rateIntegralLimit,
      ),
    );
    const actualDerivative = scale(
      subtract(actual, this.previousActual),
      1 / dt,
    );
    const desiredDerivative = scale(
      subtract(desired, this.previousDesired),
      1 / dt,
    );
    this.previousActual = { ...actual };
    this.previousDesired = { ...desired };
    const axes: Record<Axis, AxisTuning> = {
      x: tuning.rollController,
      y: tuning.yawController,
      z: tuning.pitchController,
    };
    return mapVector(error, (value, axis) =>
      clamp(
        axes[axis].kp * value +
          axes[axis].ki * this.integral[axis] -
          axes[axis].kd * actualDerivative[axis] +
          axes[axis].feedForward * desiredDerivative[axis],
        -tuning.maxControlTorque,
        tuning.maxControlTorque,
      ),
    );
  }

  reset(): void {
    this.integral = { x: 0, y: 0, z: 0 };
    this.previousActual = { x: 0, y: 0, z: 0 };
    this.previousDesired = { x: 0, y: 0, z: 0 };
  }
}

type Axis = "x" | "y" | "z";

function mapVector(
  vector: RAPIER.Vector,
  transform: (value: number, axis: Axis) => number,
): RAPIER.Vector {
  return {
    x: transform(vector.x, "x"),
    y: transform(vector.y, "y"),
    z: transform(vector.z, "z"),
  };
}

function subtract(a: RAPIER.Vector, b: RAPIER.Vector): RAPIER.Vector {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(vector: RAPIER.Vector, factor: number): RAPIER.Vector {
  return mapVector(vector, (value) => value * factor);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
