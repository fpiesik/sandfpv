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
      right: { x: 0.8, y: 0.25 },
    });
  });
});
