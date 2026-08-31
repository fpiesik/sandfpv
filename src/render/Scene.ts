import * as THREE from "three";
import { createTrainingHall } from "./TrainingHall";

export type CameraMode = "fpv" | "debug";

export interface FpvCameraConfiguration {
  angle: number;
  fov: number;
}

/** Owns the simulator scene and the two deliberately different camera rigs. */
export class Scene {
  readonly scene = new THREE.Scene();
  readonly drone = new THREE.Group();
  private readonly fpvCamera = new THREE.PerspectiveCamera(90, 1, 0.03, 200);
  private readonly debugCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  private readonly renderer: THREE.WebGLRenderer;
  private mode: CameraMode = "fpv";

  constructor(canvas: HTMLCanvasElement) {
    this.scene.background = new THREE.Color(0x111820);
    this.scene.fog = new THREE.Fog(0x111820, 25, 55);
    this.debugCamera.position.set(8, 6, 10);
    this.debugCamera.lookAt(0, 1.5, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const sunlight = new THREE.DirectionalLight(0xfff4dc, 2.4);
    sunlight.position.set(5, 7.5, 4);
    sunlight.castShadow = true;
    this.scene.add(
      sunlight,
      new THREE.HemisphereLight(0xcce8ff, 0x20242a, 1.8),
    );
    this.scene.add(createTrainingHall());

    const body = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffa800,
        roughness: 0.45,
        metalness: 0.1,
      }),
    );
    body.scale.set(1, 0.35, 1.25);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x202820 });
    for (const rotation of [Math.PI / 4, -Math.PI / 4]) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.035, 0.055),
        armMaterial,
      );
      arm.rotation.y = rotation;
      arm.castShadow = true;
      this.drone.add(arm);
    }
    body.castShadow = true;
    this.drone.add(body);

    // The FPV camera is a child of the rigid body, so translation and every
    // attitude change are inherited without a one-frame lag.
    this.fpvCamera.position.set(0, 0.11, -0.22);
    this.drone.add(this.fpvCamera);
    this.configureFpvCamera({ angle: 25, fov: 90 });
    this.scene.add(this.drone);
    this.resize();
    addEventListener("resize", this.resize);
  }

  get cameraMode(): CameraMode {
    return this.mode;
  }

  setCameraMode(mode: CameraMode): void {
    this.mode = mode;
  }

  toggleCamera(): CameraMode {
    this.mode = this.mode === "fpv" ? "debug" : "fpv";
    return this.mode;
  }

  configureFpvCamera({ angle, fov }: FpvCameraConfiguration): void {
    this.fpvCamera.rotation.x = THREE.MathUtils.degToRad(angle);
    this.fpvCamera.fov = fov;
    this.fpvCamera.updateProjectionMatrix();
  }

  render(): void {
    if (this.mode === "debug") {
      const offset = new THREE.Vector3(5, 3.2, 6).applyQuaternion(
        this.drone.quaternion,
      );
      const desired = this.drone.position.clone().add(offset);
      this.debugCamera.position.lerp(desired, 0.08);
      this.debugCamera.lookAt(this.drone.position);
    }
    this.renderer.render(
      this.scene,
      this.mode === "fpv" ? this.fpvCamera : this.debugCamera,
    );
  }

  private readonly resize = (): void => {
    const { clientWidth: width, clientHeight: height } =
      this.renderer.domElement;
    this.renderer.setSize(width, height, false);
    for (const camera of [this.fpvCamera, this.debugCamera]) {
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    }
  };
}
