import RAPIER from "@dimforge/rapier3d-compat";
import type { ControlState } from "../input/InputSource";
import { applyRateCurve, RateController } from "./RateController";
import { AIR65_II_RACING } from "./DronePresets";

export interface AxisControllerConfig {
  kp: number;
  ki: number;
  kd: number;
  feedForward: number;
}

export interface DroneConfig {
  massKg: number;
  wheelbaseM: number;
  colliderHeightM: number;
  centerOfMassOffsetM: number;
  inertiaRollKgM2: number;
  inertiaPitchKgM2: number;
  inertiaYawKgM2: number;
  thrustToWeightRatio: number;
  minMotorThrottle: number;
  maxMotorThrottle: number;
  motorTimeConstantUp: number;
  motorTimeConstantDown: number;
  dragForward: number;
  dragSideways: number;
  dragVertical: number;
  angularDrag: number;
  maxRollRate: number;
  maxPitchRate: number;
  maxYawRate: number;
  rateExpo: number;
  rollController: AxisControllerConfig;
  pitchController: AxisControllerConfig;
  yawController: AxisControllerConfig;
  rateIntegralLimit: number;
  maxControlTorque: number;
}

export const DEFAULT_DRONE_CONFIG: Readonly<DroneConfig> = AIR65_II_RACING;

export interface FlightControllerDebug {
  massKg: number;
  thrustToWeightRatio: number;
  throttleInput: number;
  motorOutput: number;
  totalThrustN: number;
  sticks: RAPIER.Vector;
  desiredRates: RAPIER.Vector;
  actualRates: RAPIER.Vector;
  torques: RAPIER.Vector;
  linearVelocity: RAPIER.Vector;
  angularVelocity: RAPIER.Vector;
  angularInertia: RAPIER.Vector;
  physicsHz: number;
}

export interface DronePose {
  position: RAPIER.Vector;
  rotation: RAPIER.Rotation;
}

const ZERO = { x: 0, y: 0, z: 0 };

/** Generic rigid-body multicopter model with body-rate (Acro) control. */
export class Drone {
  readonly body: RAPIER.RigidBody;
  private readonly collider: RAPIER.Collider;
  private motorThrottle = 0;
  private activeConfig: DroneConfig;
  private readonly rateController = new RateController();
  private debug: FlightControllerDebug;

  constructor(
    world: RAPIER.World,
    config: Readonly<DroneConfig> = DEFAULT_DRONE_CONFIG,
    private readonly initialPose: DronePose = {
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  ) {
    this.activeConfig = structuredClone(config);
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(
          initialPose.position.x,
          initialPose.position.y,
          initialPose.position.z,
        )
        .setRotation(initialPose.rotation)
        .setCanSleep(false),
    );
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        config.wheelbaseM / 2,
        config.colliderHeightM / 2,
        config.wheelbaseM / 2,
      ),
      this.body,
    );
    this.applyMassProperties(config);
    this.debug = this.emptyDebug(config);
  }

  get currentMotorThrottle(): number {
    return this.motorThrottle;
  }
  get maxThrustNewton(): number {
    return this.config.massKg * 9.81 * this.config.thrustToWeightRatio;
  }
  get config(): Readonly<DroneConfig> {
    return this.activeConfig;
  }
  get flightControllerDebug(): Readonly<FlightControllerDebug> {
    return this.debug;
  }

  configure(config: Readonly<DroneConfig>): void {
    this.activeConfig = structuredClone(config);
    this.collider.setShape(
      new RAPIER.Cuboid(
        config.wheelbaseM / 2,
        config.colliderHeightM / 2,
        config.wheelbaseM / 2,
      ),
    );
    this.applyMassProperties(config);
    this.rateController.reset();
  }

  update(
    throttle: number,
    deltaSeconds: number,
    controls: Pick<ControlState, "roll" | "pitch" | "yaw"> = {
      roll: 0,
      pitch: 0,
      yaw: 0,
    },
  ): void {
    this.body.resetForces(false);
    this.body.resetTorques(false);
    const command = clamp(throttle, 0, 1);
    const target =
      this.config.minMotorThrottle +
      command * (this.config.maxMotorThrottle - this.config.minMotorThrottle);
    const tau =
      target >= this.motorThrottle
        ? this.config.motorTimeConstantUp
        : this.config.motorTimeConstantDown;
    const alpha = tau <= 0 ? 1 : 1 - Math.exp(-deltaSeconds / tau);
    this.motorThrottle += (target - this.motorThrottle) * alpha;

    const rotation = this.body.rotation();
    const thrust = this.motorThrottle * this.maxThrustNewton;
    this.body.addForce(
      scale(rotateVector(rotation, { x: 0, y: 1, z: 0 }), thrust),
      true,
    );

    // Duct/airframe drag is anisotropic in body axes, then applied in world axes.
    const localVelocity = inverseRotateVector(rotation, this.body.linvel());
    const localDrag = {
      x: -localVelocity.x * this.config.dragSideways,
      y: -localVelocity.y * this.config.dragVertical,
      z: -localVelocity.z * this.config.dragForward,
    };
    this.body.addForce(rotateVector(rotation, localDrag), true);
    const angularVelocity = this.body.angvel();
    this.body.addTorque(scale(angularVelocity, -this.config.angularDrag), true);

    const actualRates = inverseRotateVector(rotation, angularVelocity);
    const desiredRates = {
      x: applyRateCurve(
        controls.roll,
        this.config.maxRollRate,
        this.config.rateExpo,
      ),
      y: applyRateCurve(
        controls.yaw,
        this.config.maxYawRate,
        this.config.rateExpo,
      ),
      z: applyRateCurve(
        controls.pitch,
        this.config.maxPitchRate,
        this.config.rateExpo,
      ),
    };
    const torques = this.rateController.update(
      desiredRates,
      actualRates,
      deltaSeconds,
      this.config,
    );
    this.body.addTorque(rotateVector(rotation, torques), true);
    this.debug = {
      massKg: this.config.massKg,
      thrustToWeightRatio: this.config.thrustToWeightRatio,
      throttleInput: command,
      motorOutput: this.motorThrottle,
      totalThrustN: thrust,
      sticks: { x: controls.roll, y: controls.yaw, z: controls.pitch },
      desiredRates,
      actualRates,
      torques,
      linearVelocity: { ...this.body.linvel() },
      angularVelocity: { ...angularVelocity },
      angularInertia: this.inertiaVector(this.config),
      physicsHz: 1 / deltaSeconds,
    };
  }

  reset(): void {
    this.body.setTranslation(this.initialPose.position, true);
    this.body.setRotation(this.initialPose.rotation, true);
    this.body.setLinvel(ZERO, true);
    this.body.setAngvel(ZERO, true);
    this.body.resetForces(true);
    this.body.resetTorques(true);
    this.motorThrottle = 0;
    this.rateController.reset();
    this.debug = this.emptyDebug(this.config);
  }

  private applyMassProperties(config: Readonly<DroneConfig>): void {
    // Explicit values prevent the collision box from dictating agility. The COM
    // sits slightly below the prop plane; orientation remains entirely torque-driven.
    this.collider.setMassProperties(
      config.massKg,
      { x: 0, y: config.centerOfMassOffsetM, z: 0 },
      this.inertiaVector(config),
      { x: 0, y: 0, z: 0, w: 1 },
    );
  }

  private inertiaVector(config: Readonly<DroneConfig>): RAPIER.Vector {
    return {
      x: config.inertiaRollKgM2,
      y: config.inertiaYawKgM2,
      z: config.inertiaPitchKgM2,
    };
  }

  private emptyDebug(config: Readonly<DroneConfig>): FlightControllerDebug {
    return {
      massKg: config.massKg,
      thrustToWeightRatio: config.thrustToWeightRatio,
      throttleInput: 0,
      motorOutput: 0,
      totalThrustN: 0,
      sticks: ZERO,
      desiredRates: ZERO,
      actualRates: ZERO,
      torques: ZERO,
      linearVelocity: ZERO,
      angularVelocity: ZERO,
      angularInertia: this.inertiaVector(config),
      physicsHz: 0,
    };
  }
}

function inverseRotateVector(
  q: RAPIER.Rotation,
  v: RAPIER.Vector,
): RAPIER.Vector {
  return rotateVector({ x: -q.x, y: -q.y, z: -q.z, w: q.w }, v);
}
function scale(v: RAPIER.Vector, factor: number): RAPIER.Vector {
  return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
}
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
function rotateVector(q: RAPIER.Rotation, v: RAPIER.Vector): RAPIER.Vector {
  const { x: qx, y: qy, z: qz, w: qw } = q;
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
