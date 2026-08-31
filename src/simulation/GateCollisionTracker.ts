import RAPIER from "@dimforge/rapier3d-compat";

/** Converts sensor intersections into one-shot entries; no course rules here. */
export class GateCollisionTracker {
  private readonly intersecting = new Set<number>();

  constructor(
    private readonly world: RAPIER.World,
    private readonly droneCollider: RAPIER.Collider,
    private readonly sensors: readonly RAPIER.Collider[],
  ) {}

  update(onEnter: (gateIndex: number) => void): void {
    this.sensors.forEach((sensor, index) => {
      let inside = false;
      this.world.intersectionPairsWith(sensor, (collider) => {
        if (collider.handle === this.droneCollider.handle) inside = true;
      });
      if (inside && !this.intersecting.has(index)) onEnter(index);
      if (inside) this.intersecting.add(index);
      else this.intersecting.delete(index);
    });
  }

  reset(): void {
    this.intersecting.clear();
  }
}
