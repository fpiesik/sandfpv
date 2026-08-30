import { describe, expect, it } from "vitest";
import { GATES, HALL_DEPTH, HALL_HEIGHT, HALL_WIDTH } from "./CourseLayout";

describe("expanded course layout", () => {
  it("uses a hall with three times the original footprint dimensions", () => {
    expect(HALL_WIDTH).toBe(108);
    expect(HALL_DEPTH).toBe(72);
  });

  it("keeps every redistributed gate inside the hall", () => {
    for (const gate of GATES) {
      const [x, y, z] = gate.position;
      expect(Math.abs(x) + gate.width / 2).toBeLessThan(HALL_WIDTH / 2);
      expect(Math.abs(z) + gate.width / 2).toBeLessThan(HALL_DEPTH / 2);
      expect(y + gate.height / 2).toBeLessThan(HALL_HEIGHT);
      expect(y - gate.height / 2).toBeGreaterThan(0);
    }
  });

  it("uses the additional floor space for the course", () => {
    const xCoordinates = GATES.map((gate) => gate.position[0]);
    const zCoordinates = GATES.map((gate) => gate.position[2]);
    expect(
      Math.max(...xCoordinates) - Math.min(...xCoordinates),
    ).toBeGreaterThan(70);
    expect(
      Math.max(...zCoordinates) - Math.min(...zCoordinates),
    ).toBeGreaterThan(45);
  });
});
