import { describe, expect, it } from "vitest";
import { BEST_LAP_STORAGE_KEY, LapTimer } from "./LapTimer";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("LapTimer", () => {
  it("times a lap and persists only faster best times with a version", () => {
    const storage = new MemoryStorage();
    const timer = new LapTimer(storage);
    timer.start(10);
    expect(timer.finish(22.5)).toBe(12.5);
    timer.start(30);
    timer.finish(45);
    expect(timer.best).toBe(12.5);
    expect(JSON.parse(storage.getItem(BEST_LAP_STORAGE_KEY)!)).toEqual({
      version: 1,
      bestSeconds: 12.5,
    });
    expect(new LapTimer(storage).best).toBe(12.5);
  });
});
