import type { DroneConfig } from "./Drone";

/**
 * High-performance 65 mm 1S whoop profile.
 * REFERENCE: 65 mm wheelbase, 17.7 g dry, 0702 30,000 KV motors, 1S.
 * DERIVED: 25 g AUW and inertia approximated from mass distributed over the frame.
 * SIMULATION-TUNED: 5.5:1 T/W, motor constants, drag, rates and controller gains.
 */
export const AIR65_II_RACING: Readonly<DroneConfig> = {
  massKg: 0.025,
  wheelbaseM: 0.065,
  colliderHeightM: 0.024,
  centerOfMassOffsetM: -0.003,
  inertiaRollKgM2: 0.0000132,
  inertiaPitchKgM2: 0.0000132,
  inertiaYawKgM2: 0.0000264,
  thrustToWeightRatio: 5.5,
  minMotorThrottle: 0,
  maxMotorThrottle: 1,
  motorTimeConstantUp: 0.018,
  motorTimeConstantDown: 0.025,
  dragForward: 0.012,
  dragSideways: 0.014,
  dragVertical: 0.006,
  angularDrag: 0.000002,
  maxRollRate: 800,
  maxPitchRate: 800,
  maxYawRate: 650,
  rateExpo: 0.18,
  rollController: {
    kp: 0.00055,
    ki: 0.00008,
    kd: 0.000012,
    feedForward: 0.000015,
  },
  pitchController: {
    kp: 0.00058,
    ki: 0.00008,
    kd: 0.000013,
    feedForward: 0.000016,
  },
  yawController: {
    kp: 0.0008,
    ki: 0.0001,
    kd: 0.000008,
    feedForward: 0.000012,
  },
  rateIntegralLimit: 2,
  maxControlTorque: 0.008,
};
