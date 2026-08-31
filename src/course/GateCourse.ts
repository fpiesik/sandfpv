/** Pure course state: only the currently expected gate can advance a lap. */
export class GateCourse {
  private nextGate = 0;

  constructor(
    private readonly gateCount: number,
    private readonly onChange: (nextGate: number, laps: number) => void,
  ) {
    if (gateCount < 1) throw new RangeError("A course needs at least one gate");
  }

  laps = 0;

  get expectedGate(): number {
    return this.nextGate;
  }

  pass(gateIndex: number): boolean {
    if (gateIndex !== this.nextGate) return false;
    this.nextGate = (this.nextGate + 1) % this.gateCount;
    if (this.nextGate === 0) this.laps += 1;
    this.onChange(this.nextGate, this.laps);
    return true;
  }

  reset(): void {
    this.nextGate = 0;
    this.laps = 0;
    this.onChange(this.nextGate, this.laps);
  }
}
