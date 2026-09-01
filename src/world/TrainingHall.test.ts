import { describe, expect, it } from "vitest";
import {
  GATE_BAR_THICKNESS,
  GATE_OPENING,
  HALL_DEPTH,
  HALL_HEIGHT,
  HALL_WIDTH,
  gates,
  hallSurfaces,
} from "./TrainingHall";

describe("TrainingHall", () => {
  it("uses realistic triple-sports-hall dimensions", () => {
    expect([HALL_WIDTH, HALL_DEPTH, HALL_HEIGHT]).toEqual([27, 45, 9]);
    expect(hallSurfaces[0].size).toEqual([27, 0.2, 45]);
    expect(hallSurfaces[1].position[1]).toBeCloseTo(9.1);
  });

  it("defines whoop-sized gates with wall clearance", () => {
    expect(gates.map((gate) => gate.scale)).toEqual([4, 3, 0.8, 2, 0.7]);

    for (const gate of gates) {
      const outerHalfWidth =
        (GATE_OPENING.width / 2 + GATE_BAR_THICKNESS / 2) * gate.scale;
      expect(Math.abs(gate.position[0]) + outerHalfWidth).toBeLessThanOrEqual(
        HALL_WIDTH / 2 - 1,
      );
      expect(Math.abs(gate.position[2]) + outerHalfWidth).toBeLessThanOrEqual(
        HALL_DEPTH / 2 - 1,
      );
    }
  });
});
