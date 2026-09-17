import * as THREE from "three";
import { lostPlaceMoss, lostPlaceStructures } from "../world/LostPlace";
import type { BoxDefinition } from "../world/TrainingHall";

/** Low-draw-call, modular rendering for the abandoned factory environment. */
export class LostPlaceView {
  constructor(scene: THREE.Group) {
    const definitions = [...lostPlaceStructures, ...lostPlaceMoss];
    const byColor = new Map<number, BoxDefinition[]>();
    for (const definition of definitions) {
      const batch = byColor.get(definition.color) ?? [];
      batch.push(definition);
      byColor.set(definition.color, batch);
    }

    for (const [color, batch] of byColor) this.addBatch(scene, color, batch);
    this.addPipes(scene);
    this.addDeadTrees(scene);
    this.addWayfindingLights(scene);
  }

  private addBatch(
    scene: THREE.Group,
    color: number,
    definitions: readonly BoxDefinition[],
  ): void {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.94,
        metalness: 0.08,
      }),
      definitions.length,
    );
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    definitions.forEach((definition, index) => {
      quaternion.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        definition.yaw ?? 0,
      );
      matrix.compose(
        new THREE.Vector3(...definition.position),
        quaternion,
        new THREE.Vector3(...definition.size),
      );
      mesh.setMatrixAt(index, matrix);
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  private addPipes(scene: THREE.Group): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0x70432c,
      roughness: 0.78,
      metalness: 0.42,
    });
    for (const [x, y, z, length, vertical] of [
      [-15.9, 4.5, -2, 18, true],
      [-15.7, 10.4, 4, 25, false],
      [15.8, 3.2, 15, 10, true],
    ] as const) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, length, 8),
        material,
      );
      pipe.position.set(x, y, z);
      if (!vertical) pipe.rotation.x = Math.PI / 2;
      pipe.castShadow = true;
      scene.add(pipe);
    }
  }

  private addDeadTrees(scene: THREE.Group): void {
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x302b25,
      roughness: 1,
    });
    for (const [x, z, scale] of [
      [-26, -23, 1.2],
      [26, -3, 0.9],
      [-28, 18, 1],
    ] as const) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.35, 5 * scale, 6),
        trunkMaterial,
      );
      trunk.position.set(x, 2.5 * scale, z);
      trunk.rotation.z = 0.08;
      trunk.castShadow = true;
      scene.add(trunk);
    }
  }

  private addWayfindingLights(scene: THREE.Group): void {
    // Warm pools mark entrances and the shaft without flattening the shadows.
    for (const [x, y, z, intensity] of [
      [0, 5, 21, 20],
      [10, 12, -13, 28],
      [-14, 7, -7, 16],
    ] as const) {
      const light = new THREE.PointLight(0xd9914b, intensity, 13, 2);
      light.position.set(x, y, z);
      scene.add(light);
    }
  }
}
