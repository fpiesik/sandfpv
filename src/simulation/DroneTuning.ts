import { AIR65_II_FREESTYLE_CONFIG, type DroneConfig } from "./Drone";

export const DRONE_TUNING_STORAGE_KEY = "sandfpv.drone-tuning.v1";

export type DroneTuning = Pick<
  DroneConfig,
  | "mass"
  | "maxThrust"
  | "linearDrag"
  | "angularDrag"
  | "motorResponseTime"
  | "rateExpo"
  | "integralLimit"
  | "maxTorque"
  | "angleMaxTilt"
  | "angleLevelGain"
> & {
  maxRates: DroneConfig["maxRates"];
  ratePid: DroneConfig["ratePid"];
};

export function cloneDefaultTuning(): DroneTuning {
  return {
    ...AIR65_II_FREESTYLE_CONFIG,
    maxRates: { ...AIR65_II_FREESTYLE_CONFIG.maxRates },
    ratePid: { ...AIR65_II_FREESTYLE_CONFIG.ratePid },
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
    const hover = (tuning.mass * 9.81 * 100) / tuning.maxThrust;
    this.element.innerHTML = `
      <form class="tuning-panel" aria-labelledby="tuning-title">
        <header><div><small>AIR65 · LIVE SETUP</small><h2 id="tuning-title">DROHNEN-TUNING</h2></div><button type="button" data-close aria-label="Schließen">×</button></header>
        <p class="tuning-hint">Änderungen greifen sofort. Der berechnete Schwebepunkt sollte bei etwa 20–30 % liegen.</p>
        <div class="tuning-hover"><span>SCHWEBEPUNKT</span><strong data-hover>${hover.toFixed(1)} %</strong></div>
        <div class="tuning-grid">
          ${this.field("mass", "Gewicht", tuning.mass * 1000, 15, 50, 0.5, "g")}
          ${this.field("maxThrust", "Max. Schub", tuning.maxThrust, 0.4, 2.5, 0.01, "N")}
          ${this.field("motorResponseTime", "Motor-Reaktion", tuning.motorResponseTime * 1000, 10, 150, 1, "ms")}
          ${this.field("linearDrag", "Linearer Drag", tuning.linearDrag, 0, 1, 0.01, "")}
          ${this.field("angularDrag", "Angularer Drag", tuning.angularDrag, 0, 1, 0.01, "")}
          ${this.field("rateExpo", "Rate Expo", tuning.rateExpo, 0, 1, 0.01, "")}
          ${this.field("rollRate", "Roll Rate", tuning.maxRates.roll, 1, 25, 0.1, "rad/s")}
          ${this.field("pitchRate", "Pitch Rate", tuning.maxRates.pitch, 1, 25, 0.1, "rad/s")}
          ${this.field("yawRate", "Yaw Rate", tuning.maxRates.yaw, 1, 20, 0.1, "rad/s")}
          ${this.field("kp", "PID · P", tuning.ratePid.kp, 0, 0.001, 0.00001, "")}
          ${this.field("ki", "PID · I", tuning.ratePid.ki, 0, 0.0002, 0.000005, "")}
          ${this.field("kd", "PID · D", tuning.ratePid.kd, 0, 0.00002, 0.000001, "")}
        </div>
        <footer><button type="button" data-defaults>WERKSEINSTELLUNG</button><button class="primary" type="button" data-close>FERTIG</button></footer>
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
    this.element.querySelector("form")?.addEventListener("input", (event) => {
      const form = event.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const number = (name: string): number => Number(data.get(name));
      const next: DroneTuning = {
        ...tuning,
        mass: number("mass") / 1000,
        maxThrust: number("maxThrust"),
        motorResponseTime: number("motorResponseTime") / 1000,
        linearDrag: number("linearDrag"),
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
        output.textContent = `${((next.mass * 9.81 * 100) / next.maxThrust).toFixed(1)} %`;
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
