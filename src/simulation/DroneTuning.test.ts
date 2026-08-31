import { describe, expect, it } from "vitest";
import {
  DRONE_TUNING_STORAGE_KEY,
  cloneDefaultTuning,
  loadDroneTuning,
  saveDroneTuning,
  hoverThrottle,
} from "./DroneTuning";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number {
    return this.values.size;
  }
  clear(): void {
    this.values.clear();
  }
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("drone tuning persistence", () => {
  it("merges saved values with defaults", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      DRONE_TUNING_STORAGE_KEY,
      JSON.stringify({ maxThrust: 1.1, maxRates: { roll: 15 } }),
    );

    const tuning = loadDroneTuning(storage);

    expect(tuning.maxThrust).toBe(1.1);
    expect(tuning.maxRates.roll).toBe(15);
    expect(tuning.maxRates.pitch).toBe(cloneDefaultTuning().maxRates.pitch);
  });

  it("saves a complete setup", () => {
    const storage = new MemoryStorage();
    const tuning = cloneDefaultTuning();

    saveDroneTuning(tuning, storage);

    expect(loadDroneTuning(storage)).toEqual(tuning);
  });

  it("inverts the nonlinear thrust curve for the hover display", () => {
    expect(
      hoverThrottle({
        mass: 0.025,
        maxThrust: 0.025 * 9.81 * 4,
        thrustExponent: 2,
      }),
    ).toBeCloseTo(0.5);
  });
});
