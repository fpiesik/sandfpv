import type { DroneConfig } from "./Drone";

export type ParameterEvidence =
  "manufacturer" | "derived" | "tuning-assumption";
export interface ProfileDatum {
  readonly value: string;
  readonly evidence: ParameterEvidence;
  readonly note: string;
}

/**
 * BETAFPV Air65 II Freestyle reference profile.
 * Manufacturer values are kept separate from derived/tuned simulator values.
 * Wheelbase is diagonal motor-to-motor spacing, hence each X/Z arm is 65/(2√2) mm.
 */
export const AIR65_II_REFERENCE = {
  airframeMass: {
    value: "17.8 g (battery excluded)",
    evidence: "manufacturer",
    note: "Freestyle 25,000 KV version",
  },
  wheelbase: {
    value: "65 mm diagonal",
    evidence: "manufacturer",
    note: "not overall frame width",
  },
  motors: {
    value: "4 × 0702SE II, 25,000 KV",
    evidence: "manufacturer",
    note: "KV alone does not specify thrust",
  },
  propellers: {
    value: "GF 1219S, 3 blade",
    evidence: "manufacturer",
    note: "ducted/guarded frame",
  },
  battery: {
    value: "LAVA II 1S 320 mAh, 7.2 g",
    evidence: "tuning-assumption",
    note: "mass is replaceable pending verified weighing",
  },
  allUpMass: {
    value: "25.0 g",
    evidence: "derived",
    note: "17.8 g + assumed 7.2 g battery",
  },
  inertia: {
    value: "8.1/14.5/8.1 µkg·m²",
    evidence: "derived",
    note: "point motors/frame plate plus centred battery approximation",
  },
  peakThrust: {
    value: "1.15 N total",
    evidence: "tuning-assumption",
    note: "not copied from another Air65 variant; needs a thrust-stand curve",
  },
  cameraAngle: {
    value: "25° (15–45° adjustable)",
    evidence: "tuning-assumption",
    note: "camera setting, not physics",
  },
} as const satisfies Record<string, ProfileDatum>;

export const AIR65_II_FREESTYLE_CONFIG: DroneConfig = {
  mass: 0.025,
  maxThrust: 1.15,
  thrustExponent: 1.78,
  bodyDrag: { x: 0.012, y: 0.006, z: 0.014 },
  rotorDrag: 0.018,
  inertia: { x: 8.1e-6, y: 1.45e-5, z: 8.1e-6 },
  angularDrag: 0.06,
  motorSpoolUpTime: 0.028,
  motorSpoolDownTime: 0.018,
  motorIdle: 0.055,
  motorArm: 0.065 / (2 * Math.sqrt(2)),
  yawTorqueCoefficient: 0.006,
  battery: {
    capacityAh: 0.32,
    fullVoltage: 4.35,
    emptyVoltage: 3.3,
    internalResistance: 0.035,
    recoveryTime: 0.18,
  },
  maxRates: { roll: 13.1, pitch: 13.1, yaw: 8.7 },
  rateExpo: 0.55,
  ratePid: { kp: 0.09, ki: 0.8, kd: 0.0014 },
  integralLimit: 0.012,
  mixerAuthority: 0.38,
};

/** Original aggregate-force profile retained as a documented comparison. */
export const LEGACY_AIR65_CONFIG = {
  mass: 0.025,
  maxThrust: 2.4525,
  thrustExponent: 1.65,
  motorSpoolUpTime: 0.045,
} as const;
