import RAPIER from "@dimforge/rapier3d-compat";

/** Turns sufficiently hard contact entries into one crash event. */
export class CrashTracker {
  private touching = false;

  constructor(
    private readonly world: RAPIER.World,
    private readonly droneCollider: RAPIER.Collider,
    private readonly minimumImpactSpeed = 1.5,
  ) {}

  update(impactSpeed: number, onCrash: () => void): void {
    let touching = false;
    this.world.contactPairsWith(this.droneCollider, () => (touching = true));
    if (touching && !this.touching && impactSpeed >= this.minimumImpactSpeed)
      onCrash();
    this.touching = touching;
  }

  reset(): void {
    this.touching = false;
  }
}
