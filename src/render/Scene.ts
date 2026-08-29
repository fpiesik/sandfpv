import * as THREE from "three";

export class Scene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  readonly cube: THREE.Mesh;
  private readonly renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.scene.background = new THREE.Color(0x9eb7bd);
    this.scene.fog = new THREE.Fog(0x9eb7bd, 25, 80);
    this.camera.position.set(8, 6, 10);
    this.camera.lookAt(0, 1.5, 0);

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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x465b3c, roughness: 0.9 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground, new THREE.GridHelper(40, 40, 0x75826c, 0x536149));

    this.cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0xffa800,
        roughness: 0.45,
        metalness: 0.1,
      }),
    );
    this.cube.castShadow = true;
    this.scene.add(this.cube);
    this.resize();
    addEventListener("resize", this.resize);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private readonly resize = (): void => {
    const { clientWidth: width, clientHeight: height } =
      this.renderer.domElement;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };
}
