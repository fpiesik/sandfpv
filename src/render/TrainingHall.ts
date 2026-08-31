import * as THREE from "three";
import { GATES, HALL_BOXES, OBSTACLES } from "../course/CourseLayout";

/** Creates only the low-poly visual representation of the training hall. */
export function createTrainingHall(): THREE.Group {
  const hall = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  for (const box of [...HALL_BOXES, ...OBSTACLES]) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: box.color, roughness: 0.82 }),
    );
    mesh.position.set(...box.position);
    mesh.scale.set(...box.size);
    mesh.receiveShadow = true;
    mesh.castShadow = box.position[1] > 0;
    hall.add(mesh);
  }

  const gateMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8c19,
    emissive: 0x6b2500,
    emissiveIntensity: 1.2,
    roughness: 0.45,
  });
  for (const gate of GATES) {
    const group = new THREE.Group();
    group.position.set(...gate.position);
    group.rotation.y = gate.yaw;
    const thickness = 0.22;
    const parts: readonly (readonly [number, number, number, number])[] = [
      [-gate.width / 2, 0, thickness, gate.height + thickness],
      [gate.width / 2, 0, thickness, gate.height + thickness],
      [0, gate.height / 2, gate.width + thickness, thickness],
      [0, -gate.height / 2, gate.width + thickness, thickness],
    ];
    for (const [x, y, width, height] of parts) {
      const mesh = new THREE.Mesh(geometry, gateMaterial);
      mesh.position.set(x, y, 0);
      mesh.scale.set(width, height, 0.35);
      mesh.castShadow = true;
      group.add(mesh);
    }
    hall.add(group);
  }

  const grid = new THREE.GridHelper(36, 36, 0x708090, 0x46515d);
  grid.position.y = 0.011;
  hall.add(grid);
  return hall;
}
