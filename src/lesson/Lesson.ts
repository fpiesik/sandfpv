export type LessonStatus = "idle" | "running" | "completed";

export interface LessonStep<Event> {
  readonly title: string;
  readonly hint: string;
  readonly isComplete: (event: Event) => boolean;
}

export interface LessonDefinition<Event> {
  readonly id: string;
  readonly title: string;
  readonly successMessage: string;
  readonly steps: readonly LessonStep<Event>[];
}

export interface LessonState<Event> {
  readonly definition: LessonDefinition<Event>;
  readonly status: LessonStatus;
  readonly stepIndex: number;
  readonly crashes: number;
  readonly elapsedSeconds: number;
}

/** UI-independent state machine shared by all current and future lessons. */
export class Lesson<Event> {
  private status: LessonStatus = "idle";
  private stepIndex = 0;
  private crashes = 0;
  private elapsedSeconds = 0;

  constructor(readonly definition: LessonDefinition<Event>) {
    if (definition.steps.length === 0)
      throw new RangeError("A lesson needs at least one step");
  }

  get state(): LessonState<Event> {
    return {
      definition: this.definition,
      status: this.status,
      stepIndex: this.stepIndex,
      crashes: this.crashes,
      elapsedSeconds: this.elapsedSeconds,
    };
  }

  start(): void {
    if (this.status === "idle") this.status = "running";
  }

  update(deltaSeconds: number, events: readonly Event[] = []): void {
    if (this.status !== "running") return;
    if (Number.isFinite(deltaSeconds) && deltaSeconds > 0)
      this.elapsedSeconds += deltaSeconds;

    for (const event of events) {
      const step = this.definition.steps[this.stepIndex];
      if (!step?.isComplete(event)) continue;
      this.stepIndex += 1;
      if (this.stepIndex === this.definition.steps.length) {
        this.status = "completed";
        break;
      }
    }
  }

  recordCrash(): void {
    if (this.status === "running") this.crashes += 1;
  }

  reset(): void {
    this.status = "idle";
    this.stepIndex = 0;
    this.crashes = 0;
    this.elapsedSeconds = 0;
  }
}
