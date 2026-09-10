import RAPIER from "@dimforge/rapier3d-compat";
import type { ControlState } from "../input/InputSource";
import type { Drone } from "./Drone";

export interface FlightControllerDebug {
  readonly mode: "ACRO";
  readonly desiredRates: RAPIER.Vector;
  readonly actualRates: RAPIER.Vector;
  readonly correction: RAPIER.Vector;
  readonly saturated: boolean;
}

/** Maps a normalized stick to a rate in rad/s using a conventional cubic expo. */
export function rateCurve(
  stick: number,
  maxRate: number,
  expo: number,
): number {
  const value = Math.min(1, Math.max(-1, Number.isFinite(stick) ? stick : 0));
  const shaped = (1 - expo) * Math.abs(value) + expo * Math.abs(value) ** 3;
  return Math.sign(value) * shaped * maxRate;
}

const vector = (x = 0, y = 0, z = 0): RAPIER.Vector => ({ x, y, z });

/** Body-rate controller. Local axes are X=pitch, Y=yaw and Z=roll. */
export class FlightController {
  private integral = vector();
  private previousError = vector();
  private debug: FlightControllerDebug = {
    mode: "ACRO",
    desiredRates: vector(),
    actualRates: vector(),
    correction: vector(),
    saturated: false,
  };

  constructor(private readonly drone: Drone) {}

  update(controls: ControlState, stepSeconds: number): void {
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) return;
    const config = this.drone.config;
    const rotation = this.drone.body.rotation();
    const actual = inverseRotate(rotation, this.drone.body.angvel());
    const desired = vector(
      rateCurve(controls.pitch, config.maxRates.pitch, config.rateExpo),
      rateCurve(controls.yaw, config.maxRates.yaw, config.rateExpo),
      rateCurve(-controls.roll, config.maxRates.roll, config.rateExpo),
    );
    const error = vector(
      desired.x - actual.x,
      desired.y - actual.y,
      desired.z - actual.z,
    );
    const correction = vector();
    for (const axis of ["x", "y", "z"] as const) {
      const derivative = (error[axis] - this.previousError[axis]) / stepSeconds;
      correction[axis] = clamp(
        config.ratePid.kp * error[axis] +
          config.ratePid.ki * this.integral[axis] +
          config.ratePid.kd * derivative,
        config.mixerAuthority,
      );
    }
    this.previousError = error;
    // X configuration. Roll/pitch/yaw corrections compete for the finite
    // [0,1] motor range, just as they do in an FC mixer.
    const pitch = correction.x;
    const yaw = correction.y;
    const roll = correction.z;
    const raw = [
      controls.throttle - pitch - roll + yaw,
      controls.throttle - pitch + roll - yaw,
      controls.throttle + pitch + roll + yaw,
      controls.throttle + pitch - roll - yaw,
    ];
    const saturated = raw.some((value) => value < 0 || value > 1);
    // Conditional integration is simple anti-windup: do not accumulate while
    // the requested correction cannot be represented by the motor mixer.
    if (!saturated) {
      for (const axis of ["x", "y", "z"] as const)
        this.integral[axis] = clamp(
          this.integral[axis] + error[axis] * stepSeconds,
          config.integralLimit,
        );
    } else {
      for (const axis of ["x", "y", "z"] as const)
        this.integral[axis] *= Math.exp(-stepSeconds * 8);
    }
    this.drone.stepMotorCommands(raw, stepSeconds);
    this.debug = {
      mode: "ACRO",
      desiredRates: desired,
      actualRates: actual,
      correction,
      saturated,
    };
  }

  getDebug(): FlightControllerDebug {
    return this.debug;
  }

  reset(): void {
    this.integral = vector();
    this.previousError = vector();
  }
}

function clamp(value: number, limit: number): number {
  return Math.min(limit, Math.max(-limit, value));
}

function inverseRotate(q: RAPIER.Rotation, v: RAPIER.Vector): RAPIER.Vector {
  const qx = -q.x,
    qy = -q.y,
    qz = -q.z,
    qw = q.w;
  const ix = qw * v.x + qy * v.z - qz * v.y;
  const iy = qw * v.y + qz * v.x - qx * v.z;
  const iz = qw * v.z + qx * v.y - qy * v.x;
  const iw = -qx * v.x - qy * v.y - qz * v.z;
  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  };
}
