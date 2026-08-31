import { describe, expect, it } from "vitest";
import type { ControlState } from "./InputSource";
import { stickPositions } from "./StickVisualizer";

describe("stick visualizer", () => {
  it("maps control directions to the displayed axes", () => {
    const controls: ControlState = {
      throttle: 0.75,
      yaw: 0.5,
      roll: -0.25,
      pitch: 0.8,
    };

    expect(stickPositions(controls)).toEqual({
      left: { x: -0.5, y: -0.5 },
      right: { x: -0.25, y: -0.8 },
    });
  });

  it("moves roll horizontally and pitch vertically", () => {
    expect(
      stickPositions({ throttle: 0, yaw: 0, roll: 1, pitch: 0 }).right,
    ).toEqual({ x: 1, y: -0 });
    expect(
      stickPositions({ throttle: 0, yaw: 0, roll: 0, pitch: 1 }).right,
    ).toEqual({ x: 0, y: -1 });
  });
});
