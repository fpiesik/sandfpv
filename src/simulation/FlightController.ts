import RAPIER from "@dimforge/rapier3d-compat";
import type { ControlState } from "../input/InputSource";
import type { Drone } from "./Drone";

export interface FlightControllerDebug {
  readonly mode: "ACRO";
  readonly desiredRates: RAPIER.Vector;
  readonly actualRates: RAPIER.Vector;
  readonly torque: RAPIER.Vector;
  readonly authority: number;
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
const GYRO_FILTER_HZ = 30;
const AIRMODE_AUTHORITY = 0.12;

/** Motor-speed-dependent torque available to the rate controller. */
export function controlAuthority(motorThrottle: number): number {
  const throttle = Math.min(
    1,
    Math.max(0, Number.isFinite(motorThrottle) ? motorThrottle : 0),
  );
  return AIRMODE_AUTHORITY + (1 - AIRMODE_AUTHORITY) * Math.sqrt(throttle);
}

/** Body-rate controller. Local axes are X=pitch, Y=yaw and Z=roll. */
export class FlightController {
  private integral = vector();
  private filteredRates = vector();
  private ratesInitialized = false;
  private debug: FlightControllerDebug = {
    mode: "ACRO",
    desiredRates: vector(),
    actualRates: vector(),
    torque: vector(),
    authority: AIRMODE_AUTHORITY,
  };

  constructor(private readonly drone: Drone) {}

  update(controls: ControlState, stepSeconds: number): void {
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) return;
    const config = this.drone.config;
    const rotation = this.drone.body.rotation();
    const actual = inverseRotate(rotation, this.drone.body.angvel());
    if (!this.ratesInitialized) {
      this.filteredRates = { ...actual };
      this.ratesInitialized = true;
    }
    const filterBlend =
      1 - Math.exp(-2 * Math.PI * GYRO_FILTER_HZ * stepSeconds);
    const previousFilteredRates = { ...this.filteredRates };
    for (const axis of ["x", "y", "z"] as const) {
      this.filteredRates[axis] +=
        (actual[axis] - this.filteredRates[axis]) * filterBlend;
    }
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
    const authority = controlAuthority(this.drone.currentMotorThrottle);
    const torqueLimit = config.maxTorque * authority;
    const localTorque = vector();
    for (const axis of ["x", "y", "z"] as const) {
      // D-on-measurement avoids a violent derivative kick when the pilot moves
      // the stick. Low-pass filtering represents the gyro/filtering pipeline.
      const derivative =
        -(this.filteredRates[axis] - previousFilteredRates[axis]) / stepSeconds;
      const candidateIntegral = clamp(
        this.integral[axis] + error[axis] * stepSeconds,
        config.integralLimit,
      );
      const requested =
        config.ratePid.kp * error[axis] +
        config.ratePid.ki * candidateIntegral +
        config.ratePid.kd * derivative;
      localTorque[axis] = clamp(requested, torqueLimit);
      // Do not wind the I term farther into a saturated mixer. It may still
      // unwind immediately when the accumulated correction opposes the error.
      if (
        Math.abs(requested) <= torqueLimit ||
        Math.sign(error[axis]) !== Math.sign(requested)
      ) {
        this.integral[axis] = candidateIntegral;
      }
    }
    // Like forces, Rapier's user torques persist until explicitly cleared.
    this.drone.body.resetTorques(false);
    this.drone.body.addTorque(rotate(rotation, localTorque), true);
    this.debug = {
      mode: "ACRO",
      desiredRates: desired,
      actualRates: actual,
      torque: localTorque,
      authority,
    };
  }

  getDebug(): FlightControllerDebug {
    return this.debug;
  }

  reset(): void {
    this.integral = vector();
    this.filteredRates = vector();
    this.ratesInitialized = false;
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
