import { describe, expect, it } from "vitest";
import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
} from "./AppSettings";

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

describe("app settings", () => {
  it("round-trips settings in a versioned envelope", () => {
    const storage = new MemoryStorage();
    const settings = {
      ...DEFAULT_APP_SETTINGS,
      mode: "race" as const,
      fov: 110,
    };
    saveAppSettings(settings, storage);
    expect(JSON.parse(storage.getItem(APP_SETTINGS_STORAGE_KEY)!).version).toBe(
      1,
    );
    expect(loadAppSettings(storage)).toEqual(settings);
  });

  it("falls back when the stored version is unsupported", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 99, settings: { fov: 130 } }),
    );
    expect(loadAppSettings(storage)).toEqual(DEFAULT_APP_SETTINGS);
  });
});
