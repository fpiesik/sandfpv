import type { AppSettings } from "./AppSettings";

export class SettingsPanel {
  constructor(
    private readonly element: HTMLElement,
    private readonly apply: (settings: AppSettings) => void,
  ) {}

  open(settings: AppSettings): void {
    this.element.innerHTML = `<form class="settings-panel" aria-labelledby="settings-title">
      <header><div><small>SETTINGS · GRAFIK</small><h2 id="settings-title">GRAFIK-EINSTELLUNGEN</h2></div><button type="button" data-close aria-label="Schließen">×</button></header>
      <p>Auflösung und Details werden unmittelbar auf die 3D-Ansicht angewendet.</p>
      <div class="settings-grid">
        ${field("resolutionScale", "Auflösung", settings.resolutionScale * 100, 50, 100, 10, "%")}
        <label><span>Detailstufe</span><select name="detailLevel"><option value="low" ${settings.detailLevel === "low" ? "selected" : ""}>Niedrig</option><option value="medium" ${settings.detailLevel === "medium" ? "selected" : ""}>Mittel</option><option value="high" ${settings.detailLevel === "high" ? "selected" : ""}>Hoch</option></select></label>
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
        resolutionScale: number("resolutionScale") / 100,
        detailLevel: data.get("detailLevel") as AppSettings["detailLevel"],
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
