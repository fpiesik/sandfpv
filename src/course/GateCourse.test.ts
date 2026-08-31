import { describe, expect, it, vi } from "vitest";
import { GateCourse } from "./GateCourse";

describe("GateCourse", () => {
  it("accepts gates only in fixed order and completes a lap", () => {
    const changed = vi.fn();
    const course = new GateCourse(3, changed);

    expect(course.pass(1)).toBe(false);
    expect(course.expectedGate).toBe(0);
    expect(course.pass(0)).toBe(true);
    expect(course.pass(2)).toBe(false);
    expect(course.pass(1)).toBe(true);
    expect(course.pass(2)).toBe(true);
    expect(course.laps).toBe(1);
    expect(course.expectedGate).toBe(0);
    expect(changed).toHaveBeenLastCalledWith(0, 1);
  });

  it("restores the first gate and lap counter on reset", () => {
    const changed = vi.fn();
    const course = new GateCourse(1, changed);
    course.pass(0);
    course.reset();
    expect(course.laps).toBe(0);
    expect(changed).toHaveBeenLastCalledWith(0, 0);
  });
});
