import RAPIER from "@dimforge/rapier3d-compat";
/** Translates Rapier sensor events into domain-level gate entries. */
export class GateCollisionHandler {
  constructor(
    private readonly queue: RAPIER.EventQueue,
    private readonly gateByCollider: ReadonlyMap<number, number>,
    private readonly droneBodyHandle: number,
    private readonly onGateEntered: (gateId: number) => void,
    private readonly onCrash: () => void = () => undefined,
  ) {}

  drain(world: RAPIER.World): void {
    this.queue.drainCollisionEvents((first, second, started) => {
      if (!started) return;
      const gateId =
        this.gateByCollider.get(first) ?? this.gateByCollider.get(second);
      if (gateId !== undefined) {
        const otherHandle = this.gateByCollider.has(first) ? second : first;
        const other = world.getCollider(otherHandle);
        if (other?.parent()?.handle === this.droneBodyHandle)
          this.onGateEntered(gateId);
        return;
      }
      const firstCollider = world.getCollider(first);
      const secondCollider = world.getCollider(second);
      if (
        firstCollider?.parent()?.handle === this.droneBodyHandle ||
        secondCollider?.parent()?.handle === this.droneBodyHandle
      )
        this.onCrash();
    });
  }
}
