import RAPIER from "@dimforge/rapier3d-compat";
import type { GateCourse } from "../course/GateCourse";

/** Translates Rapier sensor events into domain-level gate entries. */
export class GateCollisionHandler {
  constructor(
    private readonly queue: RAPIER.EventQueue,
    private readonly gateByCollider: ReadonlyMap<number, number>,
    private readonly droneBodyHandle: number,
    private readonly course: GateCourse,
  ) {}

  drain(world: RAPIER.World): void {
    this.queue.drainCollisionEvents((first, second, started) => {
      if (!started) return;
      const gateId =
        this.gateByCollider.get(first) ?? this.gateByCollider.get(second);
      if (gateId === undefined) return;
      const otherHandle = this.gateByCollider.has(first) ? second : first;
      const other = world.getCollider(otherHandle);
      if (other?.parent()?.handle === this.droneBodyHandle)
        this.course.enter(gateId);
    });
  }
}
