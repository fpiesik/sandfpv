import { describe, expect, it, vi } from "vitest";
import { FixedTimestep } from "./FixedTimestep";

describe("FixedTimestep", () => {
  it("steps a 120 Hz simulation independently from frame rate", () => {
    const loop = new FixedTimestep(120);
    const update = vi.fn();
    expect(loop.advance(1 / 60, update)).toBe(2);
    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith(1 / 120);
  });

  it("keeps incomplete time for the next frame", () => {
    const loop = new FixedTimestep(120);
    const update = vi.fn();
    expect(loop.advance(1 / 240, update)).toBe(0);
    expect(loop.advance(1 / 240, update)).toBe(1);
  });

  it("limits large frame gaps to avoid a spiral of death", () => {
    const loop = new FixedTimestep(120, 0.1);
    expect(loop.advance(10, () => undefined)).toBe(12);
  });
});
