import RAPIER from "@dimforge/rapier3d-compat";

export interface DroneConfig {
  mass: number;
  maxThrust: number;
  linearDrag: number;
  angularDrag: number;
  motorResponseTime: number;
}

export const DEFAULT_DRONE_CONFIG: Readonly<DroneConfig> = {
  mass: 1,
  maxThrust: 20,
  linearDrag: 0.2,
  angularDrag: 0.08,
  motorResponseTime: 0.12,
};

export interface DronePose {
  position: RAPIER.Vector;
  rotation: RAPIER.Rotation;
}

/** A deliberately small rigid-body flight model. Attitude control is added later. */
export class Drone {
  readonly body: RAPIER.RigidBody;
  private motorThrottle = 0;

  constructor(
    world: RAPIER.World,
    readonly config: Readonly<DroneConfig> = DEFAULT_DRONE_CONFIG,
    private readonly initialPose: DronePose = {
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  ) {
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(
          initialPose.position.x,
          initialPose.position.y,
          initialPose.position.z,
        )
        .setRotation(initialPose.rotation)
        .setAdditionalMass(config.mass)
        .setCanSleep(false),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.28, 0.08, 0.28).setDensity(0),
      this.body,
    );
  }

  get currentMotorThrottle(): number {
    return this.motorThrottle;
  }

  update(throttle: number, deltaSeconds: number): void {
    const targetThrottle = Math.min(1, Math.max(0, throttle));
    const response =
      this.config.motorResponseTime <= 0
        ? 1
        : 1 - Math.exp(-deltaSeconds / this.config.motorResponseTime);
    this.motorThrottle += (targetThrottle - this.motorThrottle) * response;

    const rotation = this.body.rotation();
    const localUp = rotateVector(rotation, { x: 0, y: 1, z: 0 });
    const thrust = this.motorThrottle * this.config.maxThrust;
    this.body.addForce(scale(localUp, thrust), true);

    const velocity = this.body.linvel();
    this.body.addForce(scale(velocity, -this.config.linearDrag), true);
    const angularVelocity = this.body.angvel();
    this.body.addTorque(scale(angularVelocity, -this.config.angularDrag), true);
  }

  reset(): void {
    this.body.setTranslation(this.initialPose.position, true);
    this.body.setRotation(this.initialPose.rotation, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.body.resetForces(true);
    this.body.resetTorques(true);
    this.motorThrottle = 0;
  }
}

function scale(vector: RAPIER.Vector, factor: number): RAPIER.Vector {
  return {
    x: vector.x * factor,
    y: vector.y * factor,
    z: vector.z * factor,
  };
}

function rotateVector(
  quaternion: RAPIER.Rotation,
  vector: RAPIER.Vector,
): RAPIER.Vector {
  const { x: qx, y: qy, z: qz, w: qw } = quaternion;
  const ix = qw * vector.x + qy * vector.z - qz * vector.y;
  const iy = qw * vector.y + qz * vector.x - qx * vector.z;
  const iz = qw * vector.z + qx * vector.y - qy * vector.x;
  const iw = -qx * vector.x - qy * vector.y - qz * vector.z;
  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  };
}
