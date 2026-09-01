import { describe, expect, it } from "vitest";
import { createFirstGatesLesson } from "./FirstGatesLesson";

describe("First Gates lesson", () => {
  it("only completes the three lesson gates in order", () => {
    const lesson = createFirstGatesLesson();
    lesson.start();
    lesson.update(1, [{ type: "gate-passed", gateIndex: 1 }]);
    expect(lesson.state.stepIndex).toBe(0);
    for (const gateIndex of [0, 1, 3])
      lesson.update(1, [{ type: "gate-passed", gateIndex }]);
    expect(lesson.state).toMatchObject({
      status: "completed",
      stepIndex: 3,
      elapsedSeconds: 4,
    });
  });

  it("tracks crashes and fully resets its state", () => {
    const lesson = createFirstGatesLesson();
    lesson.start();
    lesson.recordCrash();
    lesson.update(2.5);
    lesson.reset();
    expect(lesson.state).toMatchObject({
      status: "idle",
      stepIndex: 0,
      crashes: 0,
      elapsedSeconds: 0,
    });
  });
});
