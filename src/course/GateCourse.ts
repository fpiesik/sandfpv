export interface CourseProgress {
  readonly completed: number;
  readonly total: number;
  readonly expectedGate: number;
  readonly laps: number;
}

/** Pure course state: it deliberately knows nothing about Rapier or Three.js. */
export class GateCourse {
  private expectedIndex = 0;
  private lapCount = 0;

  constructor(private readonly order: readonly number[]) {
    if (order.length === 0) throw new Error("A course needs at least one gate");
  }

  enter(gateId: number): boolean {
    if (gateId !== this.order[this.expectedIndex]) return false;
    this.expectedIndex += 1;
    if (this.expectedIndex === this.order.length) {
      this.expectedIndex = 0;
      this.lapCount += 1;
    }
    return true;
  }

  reset(): void {
    this.expectedIndex = 0;
    this.lapCount = 0;
  }

  get progress(): CourseProgress {
    return {
      completed: this.expectedIndex,
      total: this.order.length,
      expectedGate: this.order[this.expectedIndex],
      laps: this.lapCount,
    };
  }
}
