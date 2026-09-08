import * as THREE from "three";
import { GATE_BAR_THICKNESS, GATE_OPENING, gates } from "../world/TrainingHall";

/** A playful classroom skin for the shared indoor flight course. */
export class ClassroomView {
  private readonly triggerMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly gateGroups: THREE.Group[] = [];

  constructor(scene: THREE.Group) {
    this.addRoom(scene);
    this.addFurniture(scene);
    this.addGates(scene);
  }

  setExpectedGate(index: number): void {
    this.triggerMaterials.forEach(
      (material, gateIndex) => (material.visible = gateIndex === index),
    );
  }

  clearExpectedGate(): void {
    this.triggerMaterials.forEach((material) => (material.visible = false));
  }

  setGateSize(scale: number): void {
    this.gateGroups.forEach((gate) => gate.scale.setScalar(scale));
  }

  private addRoom(scene: THREE.Group): void {
    this.box(scene, [27, 0.2, 45], [0, -0.1, 0], 0xd9b47b);
    this.box(scene, [27, 9, 0.2], [0, 4.5, -22.6], 0xf5e8c8);
    this.box(scene, [27, 9, 0.2], [0, 4.5, 22.6], 0xffefd2);
    this.box(scene, [0.2, 9, 45], [-13.6, 4.5, 0], 0xc8dfda);
    this.box(scene, [0.2, 9, 45], [13.6, 4.5, 0], 0xc8dfda);
    this.box(scene, [27, 0.2, 45], [0, 9.1, 0], 0xf4f0e5);

    // Blackboard, pinboard and oversized classroom ruler make the end walls legible.
    this.box(scene, [9, 3.2, 0.16], [0, 4.4, -22.42], 0x174d42);
    this.box(scene, [9.5, 0.16, 0.18], [0, 2.78, -22.28], 0xe9e0c9);
    this.box(scene, [5.5, 2.7, 0.15], [-7.5, 4.5, 22.42], 0xe1a94f);
    for (let x = -11; x <= 11; x += 2) {
      this.box(scene, [0.035, 0.008, 45], [x, 0.008, 0], 0xc79860);
    }

    const chalk = this.label("FPV 101   ★   FLY · LEARN · REPEAT", 1024, 128);
    chalk.position.set(0, 4.6, -22.31);
    chalk.scale.set(8, 1, 1);
    scene.add(chalk);
  }

  private addFurniture(scene: THREE.Group): void {
    const deskColors = [0x48a9a6, 0xf6ae2d, 0xef6f6c, 0x7b6fd0];
    const deskPositions: Array<[number, number, number]> = [
      [-8.5, 0, -13],
      [0, 0, -13],
      [8.5, 0, -13],
      [-8.5, 0, -5],
      [8.5, 0, -5],
      [-8.5, 0, 4],
      [8.5, 0, 4],
      [-8.5, 0, 13],
      [0, 0, 13],
      [8.5, 0, 13],
    ];
    deskPositions.forEach(([x, , z], index) => {
      const color = deskColors[index % deskColors.length];
      this.box(scene, [3.2, 0.18, 1.6], [x, 1.45, z], color);
      for (const dx of [-1.25, 1.25])
        for (const dz of [-0.55, 0.55])
          this.box(scene, [0.12, 1.4, 0.12], [x + dx, 0.7, z + dz], 0x4b5960);
      this.box(scene, [1.8, 0.18, 0.7], [x, 0.7, z + 1.15], 0x6a86a0);
      this.box(scene, [0.16, 1.4, 0.16], [x, 0.35, z + 1.15], 0x4b5960);
      // Pencil cup and books add small-scale detail for close flying.
      this.box(scene, [0.2, 0.42, 0.2], [x + 1, 1.75, z], 0xf45b69);
      this.box(scene, [0.85, 0.1, 0.5], [x - 0.7, 1.61, z], 0x5b8def);
    });

    // Bright suspended paper planes form a playful slalom above the desks.
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    for (let index = 0; index < 9; index++) {
      const plane = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 1.1, 3),
        planeMaterial.clone(),
      );
      (plane.material as THREE.MeshStandardMaterial).color.setHSL(
        index / 9,
        0.7,
        0.58,
      );
      plane.rotation.set(Math.PI / 2, index * 0.7, 0);
      plane.position.set(
        ((index % 3) - 1) * 5,
        5 + (index % 2),
        -15 + index * 3.7,
      );
      plane.castShadow = true;
      scene.add(plane);
    }
  }

  private addGates(scene: THREE.Group): void {
    gates.forEach((gate, index) => {
      const group = new THREE.Group();
      group.position.set(...gate.position);
      group.rotation.y = gate.yaw;
      const material = new THREE.MeshStandardMaterial({
        color: gate.color,
        emissive: gate.color,
        emissiveIntensity: 0.45,
        roughness: 0.45,
      });
      const vertical = new THREE.BoxGeometry(
        GATE_BAR_THICKNESS,
        GATE_OPENING.height + GATE_BAR_THICKNESS * 2,
        GATE_BAR_THICKNESS,
      );
      const horizontal = new THREE.BoxGeometry(
        GATE_OPENING.width,
        GATE_BAR_THICKNESS,
        GATE_BAR_THICKNESS,
      );
      for (const x of [-GATE_OPENING.width / 2, GATE_OPENING.width / 2]) {
        const bar = new THREE.Mesh(vertical, material);
        bar.position.x = x;
        group.add(bar);
      }
      for (const y of [-GATE_OPENING.height / 2, GATE_OPENING.height / 2]) {
        const bar = new THREE.Mesh(horizontal, material);
        bar.position.y = y;
        group.add(bar);
      }
      const triggerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff8a,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
        visible: index === 0,
      });
      group.add(
        new THREE.Mesh(
          new THREE.PlaneGeometry(GATE_OPENING.width, GATE_OPENING.height),
          triggerMaterial,
        ),
      );
      group.traverse((object) => (object.castShadow = true));
      this.triggerMaterials.push(triggerMaterial);
      this.gateGroups.push(group);
      scene.add(group);
    });
  }

  private box(
    scene: THREE.Group,
    size: [number, number, number],
    position: [number, number, number],
    color: number,
  ): void {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      new THREE.MeshStandardMaterial({ color, roughness: 0.82 }),
    );
    mesh.position.set(...position);
    mesh.receiveShadow = true;
    mesh.castShadow = position[1] > 0;
    scene.add(mesh);
  }

  private label(text: string, width: number, height: number): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d")!;
    context.font = "700 48px sans-serif";
    context.fillStyle = "#f6f0d5";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, width / 2, height / 2);
    return new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }),
    );
  }
}
