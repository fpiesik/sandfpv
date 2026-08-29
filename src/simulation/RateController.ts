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
  const amount = Math.min(1, Math.max(0, expo));
  const shaped = input * (1 - amount) + input * input * input * amount;
  return shaped * maxRateDegrees * (Math.PI / 180);
}

export interface RateControllerTuning {
  rateKp: number;
  rateKi: number;
  rateKd: number;
  rateIntegralLimit: number;
  maxControlTorque: number;
}

export class RateController {
  private integral: RAPIER.Vector = { x: 0, y: 0, z: 0 };
  private previousActual: RAPIER.Vector = { x: 0, y: 0, z: 0 };

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
    this.previousActual = { ...actual };
    return mapVector(error, (value, axis) =>
      clamp(
        tuning.rateKp * value +
          tuning.rateKi * this.integral[axis] -
          tuning.rateKd * actualDerivative[axis],
        -tuning.maxControlTorque,
        tuning.maxControlTorque,
      ),
    );
  }

  reset(): void {
    this.integral = { x: 0, y: 0, z: 0 };
    this.previousActual = { x: 0, y: 0, z: 0 };
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
