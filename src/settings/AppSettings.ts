export type FlightMode = "free-flight" | "first-gates" | "race";

export interface AppSettings {
  readonly mode: FlightMode;
  readonly deadband: number;
  readonly cameraAngle: number;
  readonly fov: number;
  readonly gateSize: number;
  readonly showStickVisualizer: boolean;
}

interface StoredSettings {
  readonly version: 1;
  readonly settings: AppSettings;
}

export const APP_SETTINGS_STORAGE_KEY = "sandfpv.settings";
export const DEFAULT_APP_SETTINGS: AppSettings = {
  mode: "first-gates",
  deadband: 0.03,
  cameraAngle: 20,
  fov: 95,
  gateSize: 1.5,
  showStickVisualizer: true,
};

export function loadAppSettings(storage: Storage = localStorage): AppSettings {
  try {
    const stored = JSON.parse(
      storage.getItem(APP_SETTINGS_STORAGE_KEY) ?? "null",
    ) as Partial<StoredSettings> | null;
    if (stored?.version !== 1 || !stored.settings)
      return { ...DEFAULT_APP_SETTINGS };
    return sanitize({ ...DEFAULT_APP_SETTINGS, ...stored.settings });
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveAppSettings(
  settings: AppSettings,
  storage: Storage = localStorage,
): void {
  const value: StoredSettings = { version: 1, settings: sanitize(settings) };
  storage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(value));
}

function sanitize(settings: AppSettings): AppSettings {
  const clamp = (value: number, min: number, max: number, fallback: number) =>
    Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  return {
    mode: ["free-flight", "first-gates", "race"].includes(settings.mode)
      ? settings.mode
      : DEFAULT_APP_SETTINGS.mode,
    deadband: clamp(settings.deadband, 0, 0.25, DEFAULT_APP_SETTINGS.deadband),
    cameraAngle: clamp(
      settings.cameraAngle,
      0,
      60,
      DEFAULT_APP_SETTINGS.cameraAngle,
    ),
    fov: clamp(settings.fov, 60, 130, DEFAULT_APP_SETTINGS.fov),
    gateSize: clamp(settings.gateSize, 0.75, 3, DEFAULT_APP_SETTINGS.gateSize),
    showStickVisualizer: Boolean(settings.showStickVisualizer),
  };
}
