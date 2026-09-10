import RAPIER from "@dimforge/rapier3d-compat";

export interface DroneConfig {
  readonly mass: number;
  readonly maxThrust: number;
  readonly thrustExponent: number;
  readonly bodyDrag: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
  };
  readonly rotorDrag: number;
  readonly inertia: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
  };
  readonly angularDrag: number;
  readonly motorSpoolUpTime: number;
  readonly motorSpoolDownTime: number;
  readonly motorIdle: number;
  /** X/Z distance from centre for each motor, metres. */
  readonly motorArm: number;
  /** Reaction torque divided by thrust, metres. */
  readonly yawTorqueCoefficient: number;
  readonly battery: {
    readonly capacityAh: number;
    readonly fullVoltage: number;
    readonly emptyVoltage: number;
    readonly internalResistance: number;
    readonly recoveryTime: number;
  };
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
  /** Mixer authority around collective, normalized motor command. */
  readonly mixerAuthority: number;
}

export interface DroneSpawn {
  readonly position?: RAPIER.Vector;
  readonly rotation?: RAPIER.Rotation;
}
export interface DroneTelemetry {
  readonly motorCommands: readonly number[];
  readonly motorSpeeds: readonly number[];
  readonly motorThrusts: readonly number[];
  readonly totalThrust: number;
  readonly batteryVoltage: number;
  readonly stateOfCharge: number;
}

const DEFAULT_POSITION = { x: 0, y: 0.15, z: 0 };
const IDENTITY_ROTATION = { x: 0, y: 0, z: 0, w: 1 };
const MOTOR_SIGNS = [1, -1, -1, 1] as const;

/** Four-motor rigid-body model. All calculations use SI units. */
export class Drone {
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private readonly initialPosition: RAPIER.Vector;
  private readonly initialRotation: RAPIER.Rotation;
  private motorCommands = [0, 0, 0, 0];
  private motorSpeeds = [0, 0, 0, 0];
  private motorThrusts = [0, 0, 0, 0];
  private stateOfCharge = 1;
  private batteryVoltage: number;

  constructor(
    world: RAPIER.World,
    readonly config: DroneConfig,
    spawn: DroneSpawn = {},
  ) {
    validateConfig(config);
    this.batteryVoltage = config.battery.fullVoltage;
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
        .setLinearDamping(0)
        .setAngularDamping(config.angularDrag)
        .setCcdEnabled(true),
    );
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.035, 0.009, 0.035)
        .setMassProperties(
          config.mass,
          { x: 0, y: 0, z: 0 },
          config.inertia,
          IDENTITY_ROTATION,
        )
        .setFriction(0.7)
        .setRestitution(0.08),
      this.body,
    );
  }

  applyConfig(config: DroneConfig): void {
    validateConfig(config);
    Object.assign(this.config, config, {
      maxRates: { ...config.maxRates },
      ratePid: { ...config.ratePid },
      battery: { ...config.battery },
    });
    this.collider.setMassProperties(
      config.mass,
      { x: 0, y: 0, z: 0 },
      config.inertia,
      IDENTITY_ROTATION,
    );
    this.body.setAngularDamping(config.angularDrag);
  }

  /** Compatibility/readout value: mean normalized rotor speed. */
  get currentMotorThrottle(): number {
    return this.motorSpeeds.reduce((a, b) => a + b, 0) / 4;
  }
  get telemetry(): DroneTelemetry {
    return {
      motorCommands: [...this.motorCommands],
      motorSpeeds: [...this.motorSpeeds],
      motorThrusts: [...this.motorThrusts],
      totalThrust: this.motorThrusts.reduce((a, b) => a + b, 0),
      batteryVoltage: this.batteryVoltage,
      stateOfCharge: this.stateOfCharge,
    };
  }

  /** Advances motors, battery and forces once per fixed physics step. */
  stepMotorCommands(commands: readonly number[], stepSeconds: number): void {
    if (
      commands.length !== 4 ||
      !Number.isFinite(stepSeconds) ||
      stepSeconds <= 0
    )
      return;
    this.body.resetForces(false);
    this.body.resetTorques(false);
    this.motorCommands = commands.map((v) => Math.min(1, Math.max(0, v)));
    const averageLoad = this.motorCommands.reduce((a, b) => a + b * b, 0) / 4;
    const battery = this.config.battery;
    const openCircuit =
      battery.emptyVoltage +
      (battery.fullVoltage - battery.emptyVoltage) * this.stateOfCharge;
    const estimatedCurrent = averageLoad * 14; // tuning assumption: four 0702 motors, 1S
    const sagged = Math.max(
      battery.emptyVoltage * 0.85,
      openCircuit - estimatedCurrent * battery.internalResistance,
    );
    const response = 1 - Math.exp(-stepSeconds / battery.recoveryTime);
    this.batteryVoltage += (sagged - this.batteryVoltage) * response;
    this.stateOfCharge = Math.max(
      0,
      this.stateOfCharge -
        (estimatedCurrent * stepSeconds) / (battery.capacityAh * 3600),
    );
    const voltageFactor = Math.min(
      1,
      (this.batteryVoltage / battery.fullVoltage) ** 2,
    );
    const rotation = this.body.rotation();
    const centre = this.body.translation();
    const arm = this.config.motorArm;
    const positions = [
      { x: arm, y: 0, z: -arm },
      { x: -arm, y: 0, z: -arm },
      { x: -arm, y: 0, z: arm },
      { x: arm, y: 0, z: arm },
    ];
    for (let index = 0; index < 4; index++) {
      const target =
        this.motorCommands[index] === 0
          ? 0
          : Math.max(this.config.motorIdle, this.motorCommands[index]);
      const tau =
        target >= this.motorSpeeds[index]
          ? this.config.motorSpoolUpTime
          : this.config.motorSpoolDownTime;
      this.motorSpeeds[index] +=
        (target - this.motorSpeeds[index]) * (1 - Math.exp(-stepSeconds / tau));
      const thrust =
        (this.config.maxThrust / 4) *
        this.motorSpeeds[index] ** this.config.thrustExponent *
        voltageFactor;
      this.motorThrusts[index] = thrust;
      const up = rotateVector({ x: 0, y: thrust, z: 0 }, rotation);
      const offset = rotateVector(positions[index], rotation);
      this.body.addForceAtPoint(
        up,
        {
          x: centre.x + offset.x,
          y: centre.y + offset.y,
          z: centre.z + offset.z,
        },
        true,
      );
      const yaw = rotateVector(
        {
          x: 0,
          y: MOTOR_SIGNS[index] * thrust * this.config.yawTorqueCoefficient,
          z: 0,
        },
        rotation,
      );
      this.body.addTorque(yaw, true);
    }
    this.applyAerodynamicDrag(rotation);
  }

  /** Collective-only helper retained for deterministic model tests. */
  applyThrottle(throttle: number, stepSeconds: number): void {
    this.stepMotorCommands(
      [throttle, throttle, throttle, throttle],
      stepSeconds,
    );
  }

  private applyAerodynamicDrag(rotation: RAPIER.Rotation): void {
    const local = rotateVector(this.body.linvel(), {
      x: -rotation.x,
      y: -rotation.y,
      z: -rotation.z,
      w: rotation.w,
    });
    const rotor = this.config.rotorDrag * this.currentMotorThrottle;
    const force = {
      x: -local.x * Math.abs(local.x) * (this.config.bodyDrag.x + rotor),
      y: -local.y * Math.abs(local.y) * this.config.bodyDrag.y,
      z: -local.z * Math.abs(local.z) * (this.config.bodyDrag.z + rotor),
    };
    this.body.addForce(rotateVector(force, rotation), true);
  }

  reset(): void {
    this.body.setTranslation(this.initialPosition, true);
    this.body.setRotation(this.initialRotation, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.body.resetForces(true);
    this.body.resetTorques(true);
    this.motorCommands.fill(0);
    this.motorSpeeds.fill(0);
    this.motorThrusts.fill(0);
    this.stateOfCharge = 1;
    this.batteryVoltage = this.config.battery.fullVoltage;
  }
}

function validateConfig(config: DroneConfig): void {
  const positive = [
    config.mass,
    config.maxThrust,
    config.thrustExponent,
    config.motorSpoolUpTime,
    config.motorSpoolDownTime,
    config.motorArm,
    config.yawTorqueCoefficient,
    config.battery.capacityAh,
  ];
  if (positive.some((v) => !Number.isFinite(v) || v <= 0))
    throw new RangeError("Physical parameters must be positive");
  if (config.motorIdle < 0 || config.motorIdle >= 1)
    throw new RangeError("Motor idle must be in [0, 1)");
}

export function rotateVector(
  vector: RAPIER.Vector,
  rotation: RAPIER.Rotation,
): RAPIER.Vector {
  const { x, y, z, w } = rotation;
  const tx = 2 * (y * vector.z - z * vector.y);
  const ty = 2 * (z * vector.x - x * vector.z);
  const tz = 2 * (x * vector.y - y * vector.x);
  return {
    x: vector.x + w * tx + (y * tz - z * ty),
    y: vector.y + w * ty + (z * tx - x * tz),
    z: vector.z + w * tz + (x * ty - y * tx),
  };
}
