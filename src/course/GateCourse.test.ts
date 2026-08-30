import { describe, expect, it } from "vitest";
import { GateCourse } from "./GateCourse";

describe("GateCourse", () => {
  it("only accepts gates in the fixed order", () => {
    const course = new GateCourse([1, 2, 3]);
    expect(course.enter(2)).toBe(false);
    expect(course.progress.expectedGate).toBe(1);
    expect(course.enter(1)).toBe(true);
    expect(course.enter(3)).toBe(false);
    expect(course.progress.completed).toBe(1);
  });

  it("starts a new lap after the final gate", () => {
    const course = new GateCourse([1, 2]);
    course.enter(1);
    course.enter(2);
    expect(course.progress).toEqual({
      completed: 0,
      total: 2,
      expectedGate: 1,
      laps: 1,
    });
  });
});
