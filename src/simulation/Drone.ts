import RAPIER from "@dimforge/rapier3d-compat";

export interface DroneConfig {
  /** All-up mass in kilograms. */
  readonly mass: number;
  /** Combined thrust of all four motors in newtons. */
  readonly maxThrust: number;
  /** Rapier's linear velocity damping coefficient, in s^-1. */
  readonly linearDrag: number;
  /** Rapier's angular velocity damping coefficient, in s^-1. */
  readonly angularDrag: number;
  /** Time constant of the first-order motor response, in seconds. */
  readonly motorResponseTime: number;
  /** Maximum body rates in radians per second. */
  readonly maxRates: {
    readonly roll: number;
    readonly pitch: number;
    readonly yaw: number;
  };
  readonly rateExpo: number;
  readonly ratePid: {
    readonly kp: number;
    readonly ki: number;
    readonly kd: number;
  };
  readonly integralLimit: number;
  readonly maxTorque: number;
  readonly angleMaxTilt: number;
  readonly angleLevelGain: number;
}

/** A high-performance 65 mm 1S whoop at approximately 25 g AUW. */
export const AIR65_II_FREESTYLE_CONFIG: DroneConfig = {
  mass: 0.025,
  // 5:1 thrust-to-weight puts hover at approximately 20% throttle.
  maxThrust: 0.025 * 9.81 * 5,
  linearDrag: 0.18,
  angularDrag: 0.12,
  motorResponseTime: 0.035,
  maxRates: { roll: 12, pitch: 12, yaw: 8 },
  rateExpo: 0.65,
  ratePid: { kp: 0.00012, ki: 0.000025, kd: 0.000002 },
  integralLimit: 3,
  maxTorque: 0.003,
  angleMaxTilt: Math.PI / 4,
  angleLevelGain: 5,
};

export interface DroneSpawn {
  readonly position?: RAPIER.Vector;
  readonly rotation?: RAPIER.Rotation;
}

const DEFAULT_POSITION = { x: 0, y: 0.15, z: 0 };
const IDENTITY_ROTATION = { x: 0, y: 0, z: 0, w: 1 };

/** Owns the physical state and motor model of a quadcopter. */
export class Drone {
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private readonly initialPosition: RAPIER.Vector;
  private readonly initialRotation: RAPIER.Rotation;
  private motorThrottle = 0;

  constructor(
    world: RAPIER.World,
    readonly config: DroneConfig = AIR65_II_FREESTYLE_CONFIG,
    spawn: DroneSpawn = {},
  ) {
    validateConfig(config);
    this.initialPosition = { ...(spawn.position ?? DEFAULT_POSITION) };
    this.initialRotation = { ...(spawn.rotation ?? IDENTITY_ROTATION) };
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(
          this.initialPosition.x,
          this.initialPosition.y,
          this.initialPosition.z,
        )
        .setRotation(this.initialRotation)
        .setLinearDamping(config.linearDrag)
        .setAngularDamping(config.angularDrag)
        .setCcdEnabled(true),
    );
    // 65 mm wide and deliberately shallow, approximating a ducted micro quad.
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.0325, 0.009, 0.0325)
        .setMass(config.mass)
        .setFriction(0.7)
        .setRestitution(0.08),
      this.body,
    );
  }

  /** Applies live tuning, including physical properties owned by Rapier. */
  applyConfig(config: DroneConfig): void {
    validateConfig(config);
    Object.assign(this.config, config, {
      maxRates: { ...config.maxRates },
      ratePid: { ...config.ratePid },
    });
    this.collider.setMass(config.mass);
    this.body.setLinearDamping(config.linearDrag);
    this.body.setAngularDamping(config.angularDrag);
  }

  get currentMotorThrottle(): number {
    return this.motorThrottle;
  }

  /** Updates motor lag and applies collective thrust along the drone's local +Y. */
  applyThrottle(throttle: number, stepSeconds: number): void {
    const targetThrottle = Math.min(1, Math.max(0, throttle));
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) return;

    const response = 1 - Math.exp(-stepSeconds / this.config.motorResponseTime);
    this.motorThrottle += (targetThrottle - this.motorThrottle) * response;

    const rotation = this.body.rotation();
    const localUp = {
      x: 2 * (rotation.x * rotation.y - rotation.w * rotation.z),
      y: 1 - 2 * (rotation.x ** 2 + rotation.z ** 2),
      z: 2 * (rotation.y * rotation.z + rotation.w * rotation.x),
    };
    const thrust = this.motorThrottle * this.config.maxThrust;
    this.body.addForce(
      { x: localUp.x * thrust, y: localUp.y * thrust, z: localUp.z * thrust },
      true,
    );
  }

  /** Restores the complete spawn state, including stopped motors. */
  reset(): void {
    this.body.setTranslation(this.initialPosition, true);
    this.body.setRotation(this.initialRotation, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.body.resetForces(true);
    this.body.resetTorques(true);
    this.motorThrottle = 0;
  }
}

function validateConfig(config: DroneConfig): void {
  const positive: Array<"mass" | "maxThrust" | "motorResponseTime"> = [
    "mass",
    "maxThrust",
    "motorResponseTime",
  ];
  if (positive.some((key) => !Number.isFinite(config[key]) || config[key] <= 0))
    throw new RangeError(
      "Mass, thrust and motor response time must be positive",
    );
  if (
    !Number.isFinite(config.linearDrag) ||
    !Number.isFinite(config.angularDrag) ||
    config.linearDrag < 0 ||
    config.angularDrag < 0
  )
    throw new RangeError("Drag coefficients must be non-negative");
  const tuning = [
    ...Object.values(config.maxRates),
    ...Object.values(config.ratePid),
    config.integralLimit,
    config.maxTorque,
    config.angleMaxTilt,
    config.angleLevelGain,
  ];
  if (tuning.some((value) => !Number.isFinite(value) || value < 0))
    throw new RangeError("Flight-controller tuning must be non-negative");
  if (
    !Number.isFinite(config.rateExpo) ||
    config.rateExpo < 0 ||
    config.rateExpo > 1
  )
    throw new RangeError("Rate expo must be between zero and one");
}
