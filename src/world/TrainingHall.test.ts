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
  it("uses the enlarged footprint without changing the height", () => {
    expect([HALL_WIDTH, HALL_DEPTH, HALL_HEIGHT]).toEqual([80, 120, 40]);
    expect(hallSurfaces[0].size).toEqual([80, 0.2, 120]);
    expect(hallSurfaces[1].position[1]).toBeCloseTo(40.1);
  });

  it("defines the requested gate scales with generous wall clearance", () => {
    expect(gates.map((gate) => gate.scale)).toEqual([4, 3, 2, 1, 2 / 3]);

    for (const gate of gates) {
      const outerHalfWidth =
        (GATE_OPENING.width / 2 + GATE_BAR_THICKNESS / 2) * gate.scale;
      expect(Math.abs(gate.position[0]) + outerHalfWidth).toBeLessThanOrEqual(
        HALL_WIDTH / 2 - 10,
      );
      expect(Math.abs(gate.position[2]) + outerHalfWidth).toBeLessThanOrEqual(
        HALL_DEPTH / 2 - 10,
      );
    }
  });
});
