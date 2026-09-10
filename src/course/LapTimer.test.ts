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
    expect(timer.last).toBe(15);
    expect(JSON.parse(storage.getItem(BEST_LAP_STORAGE_KEY)!)).toEqual({
      version: 2,
      bestSeconds: 12.5,
    });
    expect(new LapTimer(storage).best).toBe(12.5);
  });

  it("tracks a session best separately and starts each session fresh", () => {
    const timer = new LapTimer(new MemoryStorage());
    timer.start(0);
    timer.finish(8);
    timer.start(10);
    timer.finish(17);

    expect(timer.sessionBest).toBe(7);
    timer.startSession("training-hall", "five-gates");
    expect(timer.sessionBest).toBeUndefined();
    expect(timer.best).toBe(7);
  });

  it("stores all-time bests per environment and track and can clear them", () => {
    const storage = new MemoryStorage();
    const timer = new LapTimer(storage);
    timer.start(0);
    timer.finish(5);

    timer.startSession("classroom", "five-gates");
    expect(timer.best).toBeUndefined();
    timer.start(10);
    timer.finish(16);
    timer.clearAllTimeBest();
    expect(timer.best).toBeUndefined();

    timer.startSession("training-hall", "five-gates");
    expect(timer.best).toBe(5);
  });

  it("clears the current and last lap when reset", () => {
    const timer = new LapTimer(new MemoryStorage());
    timer.start(2);
    timer.finish(7);
    timer.reset();

    expect(timer.elapsedSeconds).toBe(0);
    expect(timer.last).toBeUndefined();
    expect(timer.best).toBe(5);
  });
});
