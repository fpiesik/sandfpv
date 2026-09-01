import type { AppSettings } from "./AppSettings";

export class SettingsPanel {
  constructor(
    private readonly element: HTMLElement,
    private readonly apply: (settings: AppSettings) => void,
  ) {}

  open(settings: AppSettings): void {
    this.element.innerHTML = `<form class="settings-panel" aria-labelledby="settings-title">
      <header><div><small>LIVE · LOKAL GESPEICHERT</small><h2 id="settings-title">FLUG-EINSTELLUNGEN</h2></div><button type="button" data-close aria-label="Schließen">×</button></header>
      <p>Alle Änderungen werden unmittelbar auf Fluggefühl und Ansicht angewendet.</p>
      <div class="settings-grid">
        ${field("deadband", "Deadband", settings.deadband, 0, 0.25, 0.01, "")}
        ${field("cameraAngle", "Kamera-Winkel", settings.cameraAngle, 0, 60, 1, "°")}
        ${field("fov", "FOV", settings.fov, 60, 130, 1, "°")}
        ${field("gateSize", "Gate-Größe", settings.gateSize, 0.75, 3, 0.05, "×")}
        <label class="settings-check"><span>Stick Visualizer</span><input name="showStickVisualizer" type="checkbox" ${settings.showStickVisualizer ? "checked" : ""}></label>
      </div>
      <footer><button class="primary" type="button" data-close>FERTIG</button></footer>
    </form>`;
    this.element.hidden = false;
    this.element
      .querySelectorAll("[data-close]")
      .forEach((button) =>
        button.addEventListener("click", () => (this.element.hidden = true)),
      );
    this.element.querySelector("form")?.addEventListener("input", (event) => {
      const form = event.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const number = (name: string) => Number(data.get(name));
      settings = {
        ...settings,
        deadband: number("deadband"),
        cameraAngle: number("cameraAngle"),
        fov: number("fov"),
        gateSize: number("gateSize"),
        showStickVisualizer: data.has("showStickVisualizer"),
      };
      this.element
        .querySelectorAll<HTMLInputElement>('input[type="range"]')
        .forEach((input) => {
          const output = input.closest("label")?.querySelector("output");
          if (output)
            output.textContent = `${input.value}${input.dataset.unit ?? ""}`;
        });
      this.apply(settings);
    });
  }
}

function field(
  name: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  unit: string,
): string {
  return `<label><span>${label}</span><output>${value}${unit}</output><input name="${name}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></label>`;
}
