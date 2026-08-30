import { Lesson, type LessonDefinition } from "./Lesson";

export interface GateEnteredEvent {
  readonly type: "gate-entered";
  readonly gateId: number;
}

const FIRST_GATES: LessonDefinition<GateEnteredEvent, number> = {
  title: "First Gates",
  objectives: [1, 2, 3],
  hint: (gate) =>
    gate === 1
      ? "Halte die Drohne ruhig und ziele mittig durch das Gate."
      : "Blicke früh zum nächsten Gate und fliege eine weiche Linie.",
  completesObjective: (event, gate) =>
    event.type === "gate-entered" && event.gateId === gate,
};

export const createFirstGatesLesson = (): Lesson<GateEnteredEvent, number> =>
  new Lesson(FIRST_GATES);
