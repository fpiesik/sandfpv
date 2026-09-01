import { Lesson, type LessonDefinition } from "./Lesson";

export interface GateLessonEvent {
  readonly type: "gate-passed";
  readonly gateIndex: number;
}

export const FIRST_GATES = [0, 1, 3] as const;

export const firstGatesDefinition: LessonDefinition<GateLessonEvent> = {
  id: "first-gates",
  title: "First Gates",
  successMessage:
    "Geschafft! Du hast alle drei Gates in Reihenfolge gemeistert.",
  steps: FIRST_GATES.map((gateIndex, index) => ({
    title: `Gate ${index + 1} von ${FIRST_GATES.length}`,
    hint:
      index === 0
        ? "Richte die Drohne früh auf die Mitte aus und halte die Höhe konstant."
        : index === 1
          ? "Lenke mit kleinen Stickbewegungen und blicke durch das Gate."
          : "Bleib ruhig am Gas und fliege sauber durch die Mitte.",
    isComplete: (event) =>
      event.type === "gate-passed" && event.gateIndex === gateIndex,
  })),
};

export function createFirstGatesLesson(): Lesson<GateLessonEvent> {
  return new Lesson(firstGatesDefinition);
}
