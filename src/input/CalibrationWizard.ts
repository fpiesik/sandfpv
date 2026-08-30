import type { AxisCalibration } from "./AxisNormalization";
import {
  INPUT_CONFIGURATION_VERSION,
  saveInputConfiguration,
  type InputConfiguration,
} from "./InputConfiguration";
import { INPUT_CHANNEL_COUNT, type ControlName } from "./InputSource";
import type { GamepadManager, GamepadSnapshot } from "./GamepadManager";

const CONTROLS: readonly ControlName[] = ["throttle", "roll", "pitch", "yaw"];
const LABELS: Record<ControlName, string> = {
  throttle: "Throttle",
  roll: "Pitch",
  pitch: "Roll",
  yaw: "Yaw",
};

/** A compact three-step wizard: mapping, range capture, then center/settings. */
export class CalibrationWizard {
  private step = 0;
  private gamepad?: GamepadSnapshot;
  private capture = false;
  private readonly draft: Record<ControlName, AxisCalibration> =
    Object.fromEntries(
      CONTROLS.map((name, axis) => [
        name,
        {
          axis,
          minimum: Infinity,
          maximum: -Infinity,
          center: 0,
          inverted: false,
          deadband: 0.05,
        },
      ]),
    ) as Record<ControlName, AxisCalibration>;

  constructor(
    private readonly root: HTMLElement,
    manager: GamepadManager,
    private readonly onSave: (configuration: InputConfiguration) => void,
  ) {
    manager.subscribe((gamepads) => {
      const wasConnected = Boolean(this.gamepad);
      this.gamepad = gamepads[0];
      if (this.capture && this.gamepad) {
        this.captureRanges(this.gamepad);
        this.updateRangeValues();
      }
      if (
        !this.root.hasAttribute("hidden") &&
        wasConnected !== Boolean(this.gamepad)
      )
        this.render();
    });
    this.root.addEventListener("click", this.onClick);
    this.root.addEventListener("change", this.onChange);
  }

  open(): void {
    this.step = 0;
    this.capture = false;
    this.root.removeAttribute("hidden");
    this.render();
  }

  private render(): void {
    const connected = Boolean(this.gamepad);
    const body = [this.mappingStep(), this.rangeStep(), this.settingsStep()][
      this.step
    ];
    this.root.innerHTML = `<div class="wizard" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <header><div><small>KALIBRIERUNG · ${this.step + 1}/3</small><h2 id="wizard-title">${["Kanäle zuordnen", "Ausschläge erfassen", "Mitte & Feinschliff"][this.step]}</h2></div><button data-action="close" aria-label="Schließen">×</button></header>
      ${connected ? body : '<p class="wizard__empty">Gamepad verbinden und eine Taste drücken.</p>'}
      <footer><button data-action="back" ${this.step === 0 ? "disabled" : ""}>Zurück</button><button class="primary" data-action="next" ${connected ? "" : "disabled"}>${this.step === 2 ? "Speichern" : "Weiter"}</button></footer>
    </div>`;
  }

  private mappingStep(): string {
    const options = Array.from(
      { length: Math.min(this.gamepad?.axes.length ?? 0, INPUT_CHANNEL_COUNT) },
      (_, axis) => axis,
    );
    return `<p>Ordne jeder Steuerfunktion eine beliebige der bis zu 16 Achsen zu.</p><div class="wizard-grid">${CONTROLS.map(
      (name) =>
        `<label>${LABELS[name]}<select data-control="${name}">${options.map((axis) => `<option value="${axis}" ${this.draft[name].axis === axis ? "selected" : ""}>Achse ${axis}</option>`).join("")}</select></label>`,
    ).join("")}</div>`;
  }

  private rangeStep(): string {
    return `<p>Bewege alle vier zugeordneten Achsen mehrfach bis zu ihren Endanschlägen.</p>
      <button class="capture ${this.capture ? "capture--active" : ""}" data-action="capture">${this.capture ? "Erfassung läuft …" : "Erfassung starten"}</button>
      <div class="wizard-values">${CONTROLS.map((name) => `<div><strong>${LABELS[name]}</strong><span data-range-min="${name}">MIN ${this.format(this.draft[name].minimum)}</span><span data-range-max="${name}">MAX ${this.format(this.draft[name].maximum)}</span></div>`).join("")}</div>`;
  }

  private settingsStep(): string {
    return `<p>Lasse die Sticks los und übernimm die aktuelle Mitte. Throttle verwendet nur Minimum und Maximum.</p>
      <button data-action="center">Aktuelle Position als Mitte</button><div class="wizard-values">${CONTROLS.map(
        (name) =>
          `<div><strong>${LABELS[name]}</strong><span>CENTER ${this.draft[name].center.toFixed(3)}</span><label>Deadband <input data-deadband="${name}" type="number" min="0" max="0.99" step="0.01" value="${this.draft[name].deadband}"></label><label><input data-invert="${name}" type="checkbox" ${this.draft[name].inverted ? "checked" : ""}> Invertieren</label></div>`,
      ).join("")}</div>`;
  }

  private readonly onClick = (event: Event): void => {
    const action = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-action]",
    )?.dataset.action;
    // Inputs are handled by `onChange`. Re-rendering for every bubbled click
    // would replace a checkbox before its change event can update the draft.
    if (!action) return;

    if (action === "close") this.root.setAttribute("hidden", "");
    if (action === "back") this.step = Math.max(0, this.step - 1);
    if (action === "capture") this.capture = !this.capture;
    if (action === "center" && this.gamepad) {
      for (const name of CONTROLS)
        this.replace(name, {
          center: this.gamepad.axes[this.draft[name].axis] ?? 0,
        });
    }
    if (action === "next") {
      if (this.step < 2) {
        this.capture = false;
        this.step++;
      } else this.save();
    }
    this.render();
  };

  private readonly onChange = (event: Event): void => {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const control = input.dataset.control as ControlName | undefined;
    const deadband = input.dataset.deadband as ControlName | undefined;
    const invert = input.dataset.invert as ControlName | undefined;
    if (control) this.replace(control, { axis: Number(input.value) });
    if (deadband) this.replace(deadband, { deadband: Number(input.value) });
    if (invert)
      this.replace(invert, { inverted: (input as HTMLInputElement).checked });
  };

  private captureRanges(gamepad: GamepadSnapshot): void {
    for (const name of CONTROLS) {
      const value = gamepad.axes[this.draft[name].axis] ?? 0;
      this.replace(name, {
        minimum: Math.min(this.draft[name].minimum, value),
        maximum: Math.max(this.draft[name].maximum, value),
      });
    }
  }

  private updateRangeValues(): void {
    for (const name of CONTROLS) {
      const minimum = this.root.querySelector<HTMLElement>(
        `[data-range-min="${name}"]`,
      );
      const maximum = this.root.querySelector<HTMLElement>(
        `[data-range-max="${name}"]`,
      );
      if (minimum)
        minimum.textContent = `MIN ${this.format(this.draft[name].minimum)}`;
      if (maximum)
        maximum.textContent = `MAX ${this.format(this.draft[name].maximum)}`;
    }
  }

  private replace(name: ControlName, value: Partial<AxisCalibration>): void {
    this.draft[name] = { ...this.draft[name], ...value };
  }

  private save(): void {
    if (!this.gamepad) return;
    for (const name of CONTROLS) {
      if (!Number.isFinite(this.draft[name].minimum))
        this.replace(name, { minimum: -1 });
      if (!Number.isFinite(this.draft[name].maximum))
        this.replace(name, { maximum: 1 });
    }
    const configuration: InputConfiguration = {
      version: INPUT_CONFIGURATION_VERSION,
      gamepadId: this.gamepad.id,
      axes: { ...this.draft },
    };
    saveInputConfiguration(configuration);
    this.onSave(configuration);
    this.root.setAttribute("hidden", "");
  }

  private format(value: number): string {
    return Number.isFinite(value) ? value.toFixed(3) : "—";
  }
}
