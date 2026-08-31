import * as THREE from "three";
import { TrainingHallView } from "./TrainingHallView";

export class Scene {
  readonly scene = new THREE.Scene();
  readonly drone = new THREE.Group();
  private readonly fpvCamera = new THREE.PerspectiveCamera(95, 1, 0.01, 200);
  private readonly debugCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly hall: TrainingHallView;
  private fpvActive = true;

  constructor(canvas: HTMLCanvasElement) {
    this.scene.background = new THREE.Color(0x9eb7bd);
    this.scene.fog = new THREE.Fog(0x9eb7bd, 25, 80);
    this.debugCamera.position.set(0.3, 0.22, 0.38);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const sunlight = new THREE.DirectionalLight(0xfff4dc, 3);
    sunlight.position.set(5, 10, 4);
    sunlight.castShadow = true;
    this.scene.add(
      sunlight,
      new THREE.HemisphereLight(0xd9f2ff, 0x293120, 1.5),
    );

    this.hall = new TrainingHallView(this.scene);

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x171c19,
      roughness: 0.7,
    });
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.015, 0.036),
      new THREE.MeshStandardMaterial({
        color: 0xffa800,
        roughness: 0.45,
      }),
    );
    canopy.position.y = 0.008;
    this.drone.add(canopy);
    for (const x of [-0.022, 0.022]) {
      for (const z of [-0.022, 0.022]) {
        const duct = new THREE.Mesh(
          new THREE.TorusGeometry(0.014, 0.0025, 6, 16),
          frameMaterial,
        );
        duct.rotation.x = Math.PI / 2;
        duct.position.set(x, 0, z);
        this.drone.add(duct);
      }
    }
    this.drone.traverse((object) => (object.castShadow = true));
    // Three.js cameras look down local -Z; the small offset represents the
    // camera mounted at the front of the frame.
    this.fpvCamera.position.set(0, 0.012, -0.024);
    this.drone.add(this.fpvCamera);
    this.scene.add(this.drone);
    this.resize();
    addEventListener("resize", this.resize);
  }

  render(): void {
    if (!this.fpvActive) {
      const chaseOffset = new THREE.Vector3(0.34, 0.2, 0.42).applyQuaternion(
        this.drone.quaternion,
      );
      this.debugCamera.position.lerp(
        this.drone.position.clone().add(chaseOffset),
        0.12,
      );
      this.debugCamera.lookAt(this.drone.position);
    }
    this.renderer.render(
      this.scene,
      this.fpvActive ? this.fpvCamera : this.debugCamera,
    );
  }

  setFpvSettings(angleDegrees: number, fovDegrees: number): void {
    this.fpvCamera.rotation.x = THREE.MathUtils.degToRad(angleDegrees);
    this.fpvCamera.fov = fovDegrees;
    this.fpvCamera.updateProjectionMatrix();
  }

  toggleCamera(): boolean {
    this.fpvActive = !this.fpvActive;
    return this.fpvActive;
  }

  setExpectedGate(index: number): void {
    this.hall.setExpectedGate(index);
  }

  private readonly resize = (): void => {
    const { clientWidth: width, clientHeight: height } =
      this.renderer.domElement;
    this.renderer.setSize(width, height, false);
    for (const camera of [this.fpvCamera, this.debugCamera]) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  };
}
