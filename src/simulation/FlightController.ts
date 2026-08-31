import RAPIER from "@dimforge/rapier3d-compat";
import type { ControlState } from "../input/InputSource";
import type { Drone, DroneConfig } from "./Drone";

export interface FlightControllerDebug {
  readonly mode: "ACRO" | "ANGLE";
  readonly desiredRates: RAPIER.Vector;
  readonly actualRates: RAPIER.Vector;
  readonly torque: RAPIER.Vector;
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
    torque: vector(),
  };

  constructor(private readonly drone: Drone) {}

  update(controls: ControlState, stepSeconds: number): void {
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) return;
    const config = this.drone.config;
    const rotation = this.drone.body.rotation();
    const actual = inverseRotate(rotation, this.drone.body.angvel());
    const desired = controls.selfLevel
      ? this.angleRates(controls, rotation, config)
      : vector(
          rateCurve(controls.pitch, config.maxRates.pitch, config.rateExpo),
          rateCurve(controls.yaw, config.maxRates.yaw, config.rateExpo),
          rateCurve(-controls.roll, config.maxRates.roll, config.rateExpo),
        );
    const error = vector(
      desired.x - actual.x,
      desired.y - actual.y,
      desired.z - actual.z,
    );
    for (const axis of ["x", "y", "z"] as const) {
      this.integral[axis] = clamp(
        this.integral[axis] + error[axis] * stepSeconds,
        config.integralLimit,
      );
    }
    const localTorque = vector();
    for (const axis of ["x", "y", "z"] as const) {
      const derivative = (error[axis] - this.previousError[axis]) / stepSeconds;
      localTorque[axis] = clamp(
        config.ratePid.kp * error[axis] +
          config.ratePid.ki * this.integral[axis] +
          config.ratePid.kd * derivative,
        config.maxTorque,
      );
    }
    this.previousError = error;
    // Like forces, Rapier's user torques persist until explicitly cleared.
    this.drone.body.resetTorques(false);
    this.drone.body.addTorque(rotate(rotation, localTorque), true);
    this.debug = {
      mode: controls.selfLevel ? "ANGLE" : "ACRO",
      desiredRates: desired,
      actualRates: actual,
      torque: localTorque,
    };
  }

  getDebug(): FlightControllerDebug {
    return this.debug;
  }

  reset(): void {
    this.integral = vector();
    this.previousError = vector();
  }

  private angleRates(
    controls: ControlState,
    rotation: RAPIER.Rotation,
    config: DroneConfig,
  ): RAPIER.Vector {
    // Local up expressed in world coordinates gives a singularity-free leveling error.
    const up = rotate(rotation, { x: 0, y: 1, z: 0 });
    const maxAngle = config.angleMaxTilt;
    const targetRoll = controls.roll * maxAngle;
    const targetPitch = controls.pitch * maxAngle;
    return vector(
      clamp(
        targetPitch * config.angleLevelGain - up.z * config.angleLevelGain,
        config.maxRates.pitch,
      ),
      rateCurve(controls.yaw, config.maxRates.yaw, config.rateExpo),
      clamp(
        -targetRoll * config.angleLevelGain - up.x * config.angleLevelGain,
        config.maxRates.roll,
      ),
    );
  }
}

function clamp(value: number, limit: number): number {
  return Math.min(limit, Math.max(-limit, value));
}

function rotate(q: RAPIER.Rotation, v: RAPIER.Vector): RAPIER.Vector {
  const ix = q.w * v.x + q.y * v.z - q.z * v.y;
  const iy = q.w * v.y + q.z * v.x - q.x * v.z;
  const iz = q.w * v.z + q.x * v.y - q.y * v.x;
  const iw = -q.x * v.x - q.y * v.y - q.z * v.z;
  return {
    x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
    y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
    z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
  };
}

function inverseRotate(q: RAPIER.Rotation, v: RAPIER.Vector): RAPIER.Vector {
  return rotate({ x: -q.x, y: -q.y, z: -q.z, w: q.w }, v);
}
