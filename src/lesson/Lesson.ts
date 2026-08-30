export type LessonStatus = "idle" | "running" | "completed";

export interface LessonState<TObjective> {
  readonly status: LessonStatus;
  readonly title: string;
  readonly objective: TObjective | null;
  readonly hint: string;
  readonly completedObjectives: number;
  readonly totalObjectives: number;
  readonly crashes: number;
  readonly elapsedMilliseconds: number;
}

export type LessonEvent<TEvent> = TEvent | { readonly type: "crash" };

export interface LessonDefinition<TEvent extends object, TObjective> {
  readonly title: string;
  readonly objectives: readonly TObjective[];
  hint(objective: TObjective): string;
  completesObjective(event: TEvent, objective: TObjective): boolean;
}

/** UI-agnostic lesson state machine driven by domain events and a supplied clock. */
export class Lesson<TEvent extends object, TObjective> {
  private status: LessonStatus = "idle";
  private objectiveIndex = 0;
  private crashCount = 0;
  private startedAt = 0;
  private elapsed = 0;

  constructor(
    private readonly definition: LessonDefinition<TEvent, TObjective>,
  ) {
    if (definition.objectives.length === 0)
      throw new Error("A lesson needs at least one objective");
  }

  start(now = performance.now()): void {
    if (this.status !== "idle") return;
    this.status = "running";
    this.startedAt = now;
  }

  update(event: LessonEvent<TEvent> | null, now = performance.now()): void {
    if (this.status !== "running") return;
    this.elapsed = Math.max(0, now - this.startedAt);
    if (!event) return;
    if ("type" in event && event.type === "crash") {
      this.crashCount += 1;
      return;
    }
    const objective = this.definition.objectives[this.objectiveIndex];
    if (!this.definition.completesObjective(event as TEvent, objective)) return;
    this.objectiveIndex += 1;
    if (this.objectiveIndex === this.definition.objectives.length)
      this.status = "completed";
  }

  reset(): void {
    this.status = "idle";
    this.objectiveIndex = 0;
    this.crashCount = 0;
    this.startedAt = 0;
    this.elapsed = 0;
  }

  get state(): LessonState<TObjective> {
    const objective = this.definition.objectives[this.objectiveIndex] ?? null;
    return {
      status: this.status,
      title: this.definition.title,
      objective,
      hint: objective ? this.definition.hint(objective) : "",
      completedObjectives: this.objectiveIndex,
      totalObjectives: this.definition.objectives.length,
      crashes: this.crashCount,
      elapsedMilliseconds: this.elapsed,
    };
  }
}
