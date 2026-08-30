import { describe, expect, it } from "vitest";
import { createFirstGatesLesson } from "./FirstGates";

describe("First Gates lesson", () => {
  it("requires the first three gates in order and completes", () => {
    const lesson = createFirstGatesLesson();
    lesson.start(100);
    lesson.update({ type: "gate-entered", gateId: 2 }, 200);
    expect(lesson.state.completedObjectives).toBe(0);
    lesson.update({ type: "gate-entered", gateId: 1 }, 300);
    lesson.update({ type: "gate-entered", gateId: 2 }, 400);
    lesson.update({ type: "gate-entered", gateId: 3 }, 500);
    expect(lesson.state.status).toBe("completed");
    expect(lesson.state.elapsedMilliseconds).toBe(400);
  });

  it("tracks crashes and resets all lesson state", () => {
    const lesson = createFirstGatesLesson();
    lesson.start(0);
    lesson.update({ type: "crash" }, 50);
    expect(lesson.state.crashes).toBe(1);
    lesson.reset();
    expect(lesson.state).toMatchObject({
      status: "idle",
      completedObjectives: 0,
      crashes: 0,
      elapsedMilliseconds: 0,
    });
  });
});
