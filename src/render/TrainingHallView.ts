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
        color: 0x7dff93,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
        visible: index === 0,
      });
      const trigger = new THREE.Mesh(
        new THREE.PlaneGeometry(GATE_OPENING.width, GATE_OPENING.height),
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
