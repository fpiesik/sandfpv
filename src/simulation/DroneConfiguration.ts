import { DEFAULT_DRONE_CONFIG, type Drone, type DroneConfig } from "./Drone";

export const DRONE_CONFIGURATION_KEY = "sandfpv.drone.v1";

type NumericDroneConfigKey = Exclude<
  keyof DroneConfig,
  "rollController" | "pitchController" | "yawController"
>;

const FIELDS: ReadonlyArray<{
  key: NumericDroneConfigKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}> = [
  {
    key: "massKg",
    label: "Masse",
    min: 0.01,
    max: 20,
    step: 0.001,
    unit: "kg",
  },
  {
    key: "thrustToWeightRatio",
    label: "Schub-Gewicht-Verhältnis",
    min: 1,
    max: 10,
    step: 0.1,
    unit: ":1",
  },
  {
    key: "minMotorThrottle",
    label: "Minimaler Motor-Throttle",
    min: 0,
    max: 1,
    step: 0.01,
    unit: "0–1",
  },
  {
    key: "maxMotorThrottle",
    label: "Maximaler Motor-Throttle",
    min: 0,
    max: 1,
    step: 0.01,
    unit: "0–1",
  },
  {
    key: "dragForward",
    label: "Widerstand vorwärts",
    min: 0,
    max: 10,
    step: 0.001,
    unit: "",
  },
  {
    key: "angularDrag",
    label: "Angularer Widerstand",
    min: 0,
    max: 10,
    step: 0.000001,
    unit: "",
  },
  {
    key: "motorTimeConstantUp",
    label: "Motor-Ansprechzeit aufwärts",
    min: 0,
    max: 2,
    step: 0.001,
    unit: "s",
  },
  {
    key: "motorTimeConstantDown",
    label: "Motor-Ansprechzeit abwärts",
    min: 0,
    max: 2,
    step: 0.001,
    unit: "s",
  },
  {
    key: "maxRollRate",
    label: "Max. Roll-Rate",
    min: 0,
    max: 2000,
    step: 10,
    unit: "°/s",
  },
  {
    key: "maxPitchRate",
    label: "Max. Pitch-Rate",
    min: 0,
    max: 2000,
    step: 10,
    unit: "°/s",
  },
  {
    key: "maxYawRate",
    label: "Max. Yaw-Rate",
    min: 0,
    max: 2000,
    step: 10,
    unit: "°/s",
  },
  {
    key: "rateExpo",
    label: "Rate Expo",
    min: 0,
    max: 0.7,
    step: 0.05,
    unit: "",
  },
  {
    key: "rateIntegralLimit",
    label: "I-Limit",
    min: 0,
    max: 100,
    step: 0.1,
    unit: "rad/s",
  },
  {
    key: "maxControlTorque",
    label: "Max. Steuerdrehmoment",
    min: 0,
    max: 100,
    step: 0.0001,
    unit: "Nm",
  },
];

export function loadDroneConfiguration(
  storage: Pick<Storage, "getItem"> = localStorage,
): DroneConfig {
  try {
    const parsed = JSON.parse(
      storage.getItem(DRONE_CONFIGURATION_KEY) ?? "null",
    ) as Partial<DroneConfig> | null;
    if (!parsed) return { ...DEFAULT_DRONE_CONFIG };
    const config = { ...structuredClone(DEFAULT_DRONE_CONFIG), ...parsed };
    return FIELDS.every(
      ({ key, min, max }) =>
        Number.isFinite(config[key]) &&
        config[key] >= min &&
        config[key] <= max,
    ) &&
      config.minMotorThrottle <= config.maxMotorThrottle &&
      config.rollController != null &&
      config.pitchController != null &&
      config.yawController != null
      ? config
      : { ...DEFAULT_DRONE_CONFIG };
  } catch {
    return { ...DEFAULT_DRONE_CONFIG };
  }
}

export class DroneConfigurationPanel {
  constructor(
    private readonly root: HTMLElement,
    private readonly drone: Drone,
    private readonly storage: Pick<Storage, "setItem"> = localStorage,
  ) {
    root.addEventListener("click", this.onClick);
    root.addEventListener("submit", this.onSubmit);
  }

  open(): void {
    this.render(this.drone.config);
    this.root.removeAttribute("hidden");
  }

  private render(config: Readonly<DroneConfig>): void {
    this.root.innerHTML = `<form class="wizard drone-configuration" role="dialog" aria-modal="true" aria-labelledby="drone-configuration-title">
      <header><div><small>FLUGMODELL</small><h2 id="drone-configuration-title">Drohne konfigurieren</h2></div><button type="button" data-action="close" aria-label="Schließen">×</button></header>
      <p>Physikalische Eigenschaften der Drohne. Änderungen werden sofort für das aktuelle Modell übernommen.</p>
      <div class="configuration-grid">${FIELDS.map(({ key, label, min, max, step, unit }) => `<label><span>${label}${unit ? ` · ${unit}` : ""}</span><input name="${key}" type="number" required min="${min}" max="${max}" step="${step}" value="${config[key]}"></label>`).join("")}</div>
      <footer><button type="button" data-action="defaults">Standardwerte</button><button class="primary" type="submit">Übernehmen</button></footer>
    </form>`;
  }

  private readonly onClick = (event: Event): void => {
    const action = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-action]",
    )?.dataset.action;
    if (action === "close") this.root.setAttribute("hidden", "");
    if (action === "defaults") this.render(DEFAULT_DRONE_CONFIG);
  };

  private readonly onSubmit = (event: Event): void => {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const values = Object.fromEntries(
      FIELDS.map(({ key }) => [key, Number(data.get(key))]),
    ) as Partial<DroneConfig>;
    const config = {
      ...structuredClone(this.drone.config),
      ...values,
    } as DroneConfig;
    if (config.minMotorThrottle > config.maxMotorThrottle) {
      const maximum = (event.target as HTMLFormElement).elements.namedItem(
        "maxMotorThrottle",
      ) as HTMLInputElement;
      maximum.setCustomValidity(
        "Der maximale Motor-Throttle muss mindestens dem minimalen entsprechen.",
      );
      maximum.reportValidity();
      return;
    }
    this.drone.configure(config);
    this.storage.setItem(DRONE_CONFIGURATION_KEY, JSON.stringify(config));
    this.root.setAttribute("hidden", "");
  };
}
