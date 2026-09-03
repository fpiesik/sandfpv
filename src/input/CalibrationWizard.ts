import type { AxisCalibration } from "./AxisNormalization";
import type { GamepadManager, GamepadSnapshot } from "./GamepadManager";
import {
  INPUT_CONFIGURATION_VERSION,
  saveInputConfiguration,
  type InputConfiguration,
} from "./InputConfiguration";
import type { ControlName } from "./InputSource";

const ORDER: readonly ControlName[] = ["throttle", "yaw", "pitch", "roll"];
const LABELS: Record<ControlName, string> = {
  throttle: "Throttle",
  yaw: "Yaw",
  pitch: "Pitch",
  roll: "Roll",
};
const DIRECTIONS: Record<ControlName, string> = {
  throttle: "Stelle Throttle ganz nach unten und bewege es dann nach oben.",
  yaw: "Bewege Yaw zuerst nach rechts, danach zu beiden Endanschlägen.",
  pitch: "Bewege Pitch zuerst nach vorn, danach zu beiden Endanschlägen.",
  roll: "Bewege Roll zuerst nach rechts, danach zu beiden Endanschlägen.",
};
const DETECTION_THRESHOLD = 0.3;

/** Sequentially detects arbitrary gamepad axes and records their calibration. */
export class CalibrationWizard {
  private gamepad?: GamepadSnapshot;
  private controlIndex = 0;
  private baseline: readonly number[] = [];
  private detectedAxis?: number;
  private firstDirection = 0;
  private minimum = Infinity;
  private maximum = -Infinity;
  private renderedState?: string;
  private resetButton?: number;
  private readonly calibrated = new Map<ControlName, AxisCalibration>();

  constructor(
    private readonly root: HTMLElement,
    manager: GamepadManager,
    private readonly onSave: (configuration: InputConfiguration) => void,
  ) {
    manager.subscribe((gamepads) => this.onGamepads(gamepads));
    this.root.addEventListener("click", this.onClick);
    this.root.addEventListener("input", this.onInput);
  }

  open(): void {
    this.gamepad = undefined;
    this.controlIndex = 0;
    this.calibrated.clear();
    this.resetButton = undefined;
    this.resetDetection();
    this.renderedState = undefined;
    this.root.removeAttribute("hidden");
    this.render();
  }

  private onGamepads(gamepads: readonly GamepadSnapshot[]): void {
    const next = gamepads[0];
    const connectionChanged = next?.id !== this.gamepad?.id;
    if (connectionChanged) {
      this.gamepad = next;
      this.resetDetection();
    } else {
      this.gamepad = next;
    }
    if (this.root.hasAttribute("hidden")) return;
    if (this.gamepad && this.controlIndex < ORDER.length) this.capture();
    else if (this.gamepad) {
      const button = this.gamepad.buttons.findIndex(({ pressed }) => pressed);
      if (button >= 0 && button !== this.resetButton) {
        this.resetButton = button;
        this.renderedState = undefined;
      }
      this.render();
    } else if (connectionChanged) this.render();
  }

  private capture(): void {
    if (!this.gamepad) return;
    if (this.detectedAxis === undefined) {
      let greatestDelta = DETECTION_THRESHOLD;
      this.gamepad.axes.forEach((value, axis) => {
        if ([...this.calibrated.values()].some((entry) => entry.axis === axis))
          return;
        const delta = Math.abs(value - (this.baseline[axis] ?? value));
        if (delta > greatestDelta) {
          greatestDelta = delta;
          this.detectedAxis = axis;
        }
      });
      if (this.detectedAxis !== undefined) {
        const center = this.baseline[this.detectedAxis] ?? 0;
        const value = this.gamepad.axes[this.detectedAxis] ?? center;
        this.firstDirection = Math.sign(value - center);
        this.minimum = Math.min(center, value);
        this.maximum = Math.max(center, value);
      }
    } else {
      const value = this.gamepad.axes[this.detectedAxis];
      if (value !== undefined) {
        this.minimum = Math.min(this.minimum, value);
        this.maximum = Math.max(this.maximum, value);
      }
    }
    this.render();
  }

  private resetDetection(): void {
    this.baseline = this.gamepad?.axes.slice() ?? [];
    this.detectedAxis = undefined;
    this.firstDirection = 0;
    this.minimum = Infinity;
    this.maximum = -Infinity;
  }

  private render(): void {
    const control = ORDER[this.controlIndex];
    const renderedState = `${this.gamepad?.id ?? ""}:${this.controlIndex}:${this.detectedAxis ?? ""}:${this.resetButton ?? ""}`;
    if (this.renderedState === renderedState) {
      this.updateReadings();
      return;
    }
    this.renderedState = renderedState;
    const progress = ORDER.map(
      (name, index) =>
        `<li class="${index < this.controlIndex ? "done" : index === this.controlIndex ? "active" : ""}">${LABELS[name]}</li>`,
    ).join("");
    const axisFound = this.detectedAxis !== undefined;
    this.root.innerHTML = `<div class="wizard" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <header><div><small>INPUT-KALIBRIERUNG</small><h2 id="wizard-title">${control ? `${LABELS[control]} zuordnen` : "Kalibrierung abgeschlossen"}</h2></div><button data-action="close" aria-label="Schließen">×</button></header>
      <ol class="wizard-progress">${progress}</ol>
      ${!this.gamepad ? '<p class="wizard__empty">Gamepad verbinden und eine Taste drücken.</p>' : control ? `<div class="wizard-instruction"><strong>${DIRECTIONS[control]}</strong><p>${axisFound ? `Achse ${this.detectedAxis} erkannt. Bewege sie über den gesamten Bereich.` : "Warte auf eine deutliche Achsenbewegung …"}</p></div><dl class="wizard-reading"><div><dt>Achse</dt><dd data-reading="axis">${this.detectedAxis ?? "—"}</dd></div><div><dt>Minimum</dt><dd data-reading="minimum">${this.format(this.minimum)}</dd></div><div><dt>Maximum</dt><dd data-reading="maximum">${this.format(this.maximum)}</dd></div><div><dt>Center</dt><dd data-reading="center">${this.format(this.baseline[this.detectedAxis ?? -1])}</dd></div></dl>` : '<p class="wizard-success">Alle vier Steuerachsen wurden erkannt. Du kannst Deadband und Invertierung prüfen und die Konfiguration speichern.</p>'}
      ${!control ? `<div class="wizard-instruction"><strong>Reset-Taste zuordnen</strong><p>${this.resetButton === undefined ? "Betätige die gewünschte Controller-Taste …" : `Button ${this.resetButton} erkannt.`}</p></div>${this.settings()}` : ""}
      <footer><button data-action="restart">Neu starten</button><button class="primary" data-action="next" ${this.gamepad && (axisFound || (!control && this.resetButton !== undefined)) ? "" : "disabled"}>${control ? "Achse übernehmen" : "Speichern"}</button></footer>
    </div>`;
  }

  /** Keep live values current without replacing a button during its click. */
  private updateReadings(): void {
    const values = {
      axis: this.detectedAxis?.toString() ?? "—",
      minimum: this.format(this.minimum),
      maximum: this.format(this.maximum),
      center: this.format(this.baseline[this.detectedAxis ?? -1]),
    };
    for (const [name, value] of Object.entries(values)) {
      const reading = this.root.querySelector<HTMLElement>(
        `[data-reading="${name}"]`,
      );
      if (reading) reading.textContent = value;
    }
  }

  private settings(): string {
    return `<div class="wizard-settings">${ORDER.map((name) => {
      const axis = this.calibrated.get(name);
      return `<fieldset><legend>${LABELS[name]} · Achse ${axis?.axis}</legend><label>Deadband <input type="number" data-deadband="${name}" min="0" max="0.5" step="0.01" value="${axis?.deadband ?? 0.05}"></label><label><input type="checkbox" data-invert="${name}" ${axis?.inverted ? "checked" : ""}> Invertieren</label></fieldset>`;
    }).join("")}</div>`;
  }

  private readonly onClick = (event: Event): void => {
    const action = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-action]",
    )?.dataset.action;
    if (action === "close") this.root.setAttribute("hidden", "");
    if (action === "restart") {
      this.controlIndex = 0;
      this.calibrated.clear();
      this.resetButton = undefined;
      this.resetDetection();
    }
    if (action === "next") {
      const control = ORDER[this.controlIndex];
      if (control && this.detectedAxis !== undefined) {
        const center = this.baseline[this.detectedAxis] ?? 0;
        this.calibrated.set(control, {
          axis: this.detectedAxis,
          minimum: this.minimum,
          maximum: this.maximum,
          center,
          inverted: this.firstDirection < 0,
          deadband: 0.05,
        });
        this.controlIndex++;
        this.resetDetection();
      } else if (!control) {
        this.save();
      }
    }
    this.render();
  };

  private readonly onInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const name = input.dataset.deadband as ControlName | undefined;
    if (name) {
      const current = this.calibrated.get(name);
      if (current)
        this.calibrated.set(name, {
          ...current,
          deadband: Math.min(0.5, Math.max(0, Number(input.value) || 0)),
        });
      return;
    }
    const inverted = input.dataset.invert as ControlName | undefined;
    const current = inverted && this.calibrated.get(inverted);
    if (inverted && current)
      this.calibrated.set(inverted, {
        ...current,
        inverted: input.checked,
      });
  };

  private save(): void {
    if (
      !this.gamepad ||
      this.calibrated.size !== ORDER.length ||
      this.resetButton === undefined
    )
      return;
    const axes = Object.fromEntries(this.calibrated) as Record<
      ControlName,
      AxisCalibration
    >;
    const configuration: InputConfiguration = {
      version: INPUT_CONFIGURATION_VERSION,
      gamepadId: this.gamepad.id,
      axes,
      resetButton: this.resetButton,
    };
    saveInputConfiguration(configuration);
    this.onSave(configuration);
    this.root.setAttribute("hidden", "");
  }

  private format(value: number | undefined): string {
    return value !== undefined && Number.isFinite(value)
      ? value.toFixed(3)
      : "—";
  }
}
