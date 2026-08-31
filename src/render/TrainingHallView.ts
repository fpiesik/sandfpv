import * as THREE from "three";
import {
  GATE_BAR_THICKNESS,
  GATE_OPENING,
  gates,
  hallSurfaces,
  obstacles,
  type BoxDefinition,
} from "../world/TrainingHall";

/** Visual representation only; physics and lap state live outside Three.js. */
export class TrainingHallView {
  private readonly triggerMaterials: THREE.MeshBasicMaterial[] = [];

  constructor(scene: THREE.Scene) {
    for (const box of [...hallSurfaces, ...obstacles])
      scene.add(this.createBox(box));

    gates.forEach((gate, index) => {
      const openingWidth = GATE_OPENING.width * gate.scale;
      const openingHeight = GATE_OPENING.height * gate.scale;
      const barThickness = GATE_BAR_THICKNESS * gate.scale;
      const group = new THREE.Group();
      group.position.set(...gate.position);
      group.rotation.y = gate.yaw;
      const material = new THREE.MeshStandardMaterial({
        color: gate.color,
        emissive: gate.color,
        emissiveIntensity: 0.35,
        roughness: 0.5,
      });
      const vertical = new THREE.BoxGeometry(
        barThickness,
        openingHeight + barThickness * 2,
        barThickness,
      );
      const horizontal = new THREE.BoxGeometry(
        openingWidth,
        barThickness,
        barThickness,
      );
      for (const x of [-openingWidth / 2, openingWidth / 2]) {
        const bar = new THREE.Mesh(vertical, material);
        bar.position.x = x;
        group.add(bar);
      }
      for (const y of [-openingHeight / 2, openingHeight / 2]) {
        const bar = new THREE.Mesh(horizontal, material);
        bar.position.y = y;
        group.add(bar);
      }
      const triggerMaterial = new THREE.MeshBasicMaterial({
        color: 0x7dff93,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
        visible: index === 0,
      });
      const trigger = new THREE.Mesh(
        new THREE.PlaneGeometry(openingWidth, openingHeight),
        triggerMaterial,
      );
      group.add(trigger);
      this.triggerMaterials.push(triggerMaterial);
      group.traverse((object) => {
        object.castShadow = true;
        object.receiveShadow = true;
      });
      scene.add(group);
    });
    this.addReferenceGeometry(scene);
  }

  private addReferenceGeometry(scene: THREE.Scene): void {
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0xe7ddbd,
      roughness: 0.9,
    });
    // Closely spaced court markings make ground speed and altitude legible in FPV.
    for (let x = -12; x <= 12; x += 1.5) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.006, 43),
        lineMaterial,
      );
      line.position.set(x, 0.004, 0);
      scene.add(line);
    }
    for (let z = -21; z <= 21; z += 1.5) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(25, 0.006, 0.025),
        lineMaterial,
      );
      line.position.set(0, 0.004, z);
      scene.add(line);
    }

    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x252d32,
      roughness: 0.75,
    });
    for (let z = -21; z <= 21; z += 3) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(27, 0.12, 0.12),
        beamMaterial,
      );
      beam.position.set(0, 8.82, z);
      beam.castShadow = true;
      scene.add(beam);
    }
    for (const x of [-9, 0, 9]) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 45),
        beamMaterial,
      );
      beam.position.set(x, 8.74, 0);
      scene.add(beam);
    }
  }

  setExpectedGate(index: number): void {
    this.triggerMaterials.forEach(
      (material, gateIndex) => (material.visible = gateIndex === index),
    );
  }

  private createBox(definition: BoxDefinition): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...definition.size),
      new THREE.MeshStandardMaterial({
        color: definition.color,
        roughness: 0.85,
      }),
    );
    mesh.position.set(...definition.position);
    mesh.rotation.y = definition.yaw ?? 0;
    mesh.receiveShadow = true;
    mesh.castShadow = definition.position[1] > 0;
    return mesh;
  }
}
