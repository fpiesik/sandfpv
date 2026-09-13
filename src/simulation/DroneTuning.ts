import { AIR65_II_FREESTYLE_CONFIG, type DroneConfig } from "./Drone";

export const DRONE_TUNING_STORAGE_KEY = "sandfpv.drone-tuning.v2";

export type DroneTuning = Pick<
  DroneConfig,
  | "mass"
  | "maxThrust"
  | "thrustExponent"
  | "bodyDrag"
  | "rotorDrag"
  | "inertia"
  | "angularDrag"
  | "motorSpoolUpTime"
  | "motorSpoolDownTime"
  | "rateExpo"
  | "integralLimit"
  | "maxTorque"
> & {
  maxRates: DroneConfig["maxRates"];
  ratePid: DroneConfig["ratePid"];
};

export function cloneDefaultTuning(): DroneTuning {
  return {
    ...AIR65_II_FREESTYLE_CONFIG,
    maxRates: { ...AIR65_II_FREESTYLE_CONFIG.maxRates },
    ratePid: { ...AIR65_II_FREESTYLE_CONFIG.ratePid },
    bodyDrag: { ...AIR65_II_FREESTYLE_CONFIG.bodyDrag },
    inertia: { ...AIR65_II_FREESTYLE_CONFIG.inertia },
  };
}

export function loadDroneTuning(storage: Storage = localStorage): DroneTuning {
  const defaults = cloneDefaultTuning();
  try {
    const saved = JSON.parse(
      storage.getItem(DRONE_TUNING_STORAGE_KEY) ?? "null",
    ) as Partial<DroneTuning> | null;
    if (!saved) return defaults;
    return {
      ...defaults,
      ...saved,
      maxRates: { ...defaults.maxRates, ...saved.maxRates },
      ratePid: { ...defaults.ratePid, ...saved.ratePid },
      bodyDrag: { ...defaults.bodyDrag, ...saved.bodyDrag },
      inertia: { ...defaults.inertia, ...saved.inertia },
    };
  } catch {
    return defaults;
  }
}

export function saveDroneTuning(
  tuning: DroneTuning,
  storage: Storage = localStorage,
): void {
  storage.setItem(DRONE_TUNING_STORAGE_KEY, JSON.stringify(tuning));
}

export function serializeDroneTuning(tuning: DroneTuning): string {
  return `${JSON.stringify(tuning, null, 2)}\n`;
}

export function parseDroneTuning(contents: string): DroneTuning {
  const parsed: unknown = JSON.parse(contents);
  const defaults = cloneDefaultTuning();
  if (!isNumericShape(parsed, defaults)) {
    throw new Error(
      "Die Datei enthält keine vollständige Drohnen-Konfiguration.",
    );
  }
  return parsed;
}

function isNumericShape(value: unknown, shape: object): value is DroneTuning {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const record = value as Record<string, unknown>;
  return Object.entries(shape).every(([key, expected]) => {
    const actual = record[key];
    if (typeof expected === "number")
      return typeof actual === "number" && Number.isFinite(actual);
    return isNumericShape(actual, expected as object);
  });
}

export class DroneTuningPanel {
  constructor(
    private readonly element: HTMLElement,
    private readonly apply: (tuning: DroneTuning) => void,
  ) {}

  open(tuning: DroneTuning): void {
    this.render(tuning);
    this.element.hidden = false;
  }

  private render(tuning: DroneTuning): void {
    const hover = hoverThrottle(tuning) * 100;
    this.element.innerHTML = `
      <form class="tuning-panel" aria-labelledby="tuning-title">
        <header><div><small>AIR65 · LIVE SETUP</small><h2 id="tuning-title">DROHNEN-TUNING</h2></div><button type="button" data-close aria-label="Schließen">×</button></header>
        <p class="tuning-hint">Änderungen greifen sofort. Der berechnete Schwebepunkt sollte bei etwa 20–30 % liegen.</p>
        <div class="tuning-hover"><span>SCHWEBEPUNKT</span><strong data-hover>${hover.toFixed(1)} %</strong></div>
        <div class="tuning-grid">
          ${this.field("mass", "Gewicht", tuning.mass * 1000, 15, 50, 0.5, "g")}
          ${this.field("maxThrust", "Max. Schub", tuning.maxThrust, 0.4, 2.5, 0.01, "N")}
          ${this.field("thrustExponent", "Schub-Exponent", tuning.thrustExponent, 1, 2.5, 0.01, "")}
          ${this.field("motorSpoolUpTime", "Spool-up", tuning.motorSpoolUpTime * 1000, 10, 150, 1, "ms")}
          ${this.field("motorSpoolDownTime", "Spool-down", tuning.motorSpoolDownTime * 1000, 5, 100, 1, "ms")}
          ${this.field("bodyDragX", "Körper-Drag X", tuning.bodyDrag.x, 0, 0.1, 0.001, "")}
          ${this.field("bodyDragY", "Körper-Drag Y", tuning.bodyDrag.y, 0, 0.1, 0.001, "")}
          ${this.field("bodyDragZ", "Körper-Drag Z", tuning.bodyDrag.z, 0, 0.1, 0.001, "")}
          ${this.field("rotorDrag", "Rotor-Drag lateral", tuning.rotorDrag, 0, 0.1, 0.001, "")}
          ${this.field("angularDrag", "Angularer Drag", tuning.angularDrag, 0, 1, 0.01, "")}
          ${this.field("rateExpo", "Rate Expo", tuning.rateExpo, 0, 1, 0.01, "")}
          ${this.field("rollRate", "Roll Rate", tuning.maxRates.roll, 1, 25, 0.1, "rad/s")}
          ${this.field("pitchRate", "Pitch Rate", tuning.maxRates.pitch, 1, 25, 0.1, "rad/s")}
          ${this.field("yawRate", "Yaw Rate", tuning.maxRates.yaw, 1, 20, 0.1, "rad/s")}
          ${this.field("kp", "PID · P", tuning.ratePid.kp, 0, 0.001, 0.00001, "")}
          ${this.field("ki", "PID · I", tuning.ratePid.ki, 0, 0.0002, 0.000005, "")}
          ${this.field("kd", "PID · D", tuning.ratePid.kd, 0, 0.00002, 0.000001, "")}
        </div>
        <footer><div class="tuning-file-actions"><button type="button" data-defaults>WERKSEINSTELLUNG</button><button type="button" data-save-file>LOKAL SPEICHERN</button><button type="button" data-load-file>LOKAL LADEN</button><input type="file" data-file-input accept="application/json,.json" hidden><p class="tuning-file-status" data-file-status aria-live="polite"></p></div><button class="primary" type="button" data-close>FERTIG</button></footer>
      </form>`;
    this.element
      .querySelectorAll("[data-close]")
      .forEach((button) =>
        button.addEventListener("click", () => (this.element.hidden = true)),
      );
    this.element
      .querySelector("[data-defaults]")
      ?.addEventListener("click", () => {
        const defaults = cloneDefaultTuning();
        this.apply(defaults);
        this.render(defaults);
      });
    this.element
      .querySelector("[data-save-file]")
      ?.addEventListener("click", () => this.download(tuning));
    const fileInput =
      this.element.querySelector<HTMLInputElement>("[data-file-input]");
    this.element
      .querySelector("[data-load-file]")
      ?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const imported = parseDroneTuning(await file.text());
        this.apply(imported);
        this.render(imported);
        this.setFileStatus(`„${file.name}“ wurde geladen.`);
      } catch (error) {
        this.setFileStatus(
          error instanceof Error
            ? error.message
            : "Die Datei konnte nicht geladen werden.",
          true,
        );
        fileInput.value = "";
      }
    });
    this.element.querySelector("form")?.addEventListener("input", (event) => {
      const form = event.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const number = (name: string): number => Number(data.get(name));
      const next: DroneTuning = {
        ...tuning,
        mass: number("mass") / 1000,
        maxThrust: number("maxThrust"),
        thrustExponent: number("thrustExponent"),
        motorSpoolUpTime: number("motorSpoolUpTime") / 1000,
        motorSpoolDownTime: number("motorSpoolDownTime") / 1000,
        bodyDrag: {
          x: number("bodyDragX"),
          y: number("bodyDragY"),
          z: number("bodyDragZ"),
        },
        rotorDrag: number("rotorDrag"),
        angularDrag: number("angularDrag"),
        rateExpo: number("rateExpo"),
        maxRates: {
          roll: number("rollRate"),
          pitch: number("pitchRate"),
          yaw: number("yawRate"),
        },
        ratePid: { kp: number("kp"), ki: number("ki"), kd: number("kd") },
      };
      tuning = next;
      const output = this.element.querySelector<HTMLElement>("[data-hover]");
      if (output)
        output.textContent = `${(hoverThrottle(next) * 100).toFixed(1)} %`;
      this.element
        .querySelectorAll<HTMLInputElement>("input")
        .forEach((input) => {
          const value = input.closest("label")?.querySelector("output");
          if (value)
            value.textContent = `${input.value} ${input.dataset.unit ?? ""}`;
        });
      this.apply(next);
    });
  }

  private download(tuning: DroneTuning): void {
    const url = URL.createObjectURL(
      new Blob([serializeDroneTuning(tuning)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "sandfpv-air65-tuning.json";
    link.click();
    URL.revokeObjectURL(url);
    this.setFileStatus("Konfiguration wurde lokal gespeichert.");
  }

  private setFileStatus(message: string, error = false): void {
    const status =
      this.element.querySelector<HTMLElement>("[data-file-status]");
    if (!status) return;
    status.textContent = message;
    status.toggleAttribute("data-error", error);
  }

  private field(
    name: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    unit: string,
  ): string {
    return `<label><span>${label}</span><output>${value} ${unit}</output><input name="${name}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></label>`;
  }
}

export function hoverThrottle(
  tuning: Pick<DroneTuning, "mass" | "maxThrust" | "thrustExponent">,
): number {
  return (
    ((tuning.mass * 9.81) / tuning.maxThrust) ** (1 / tuning.thrustExponent)
  );
}
