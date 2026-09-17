import type { AppSettings } from "./AppSettings";

const MIN_GATE_SIZE = 0.75;
const MAX_GATE_SIZE = 3;
const GATE_SIZE_STEP = 0.25;

export class TrackOptionsPanel {
  constructor(
    private readonly element: HTMLElement,
    private readonly apply: (settings: AppSettings) => void,
  ) {}

  open(settings: AppSettings): void {
    this.element.innerHTML = `<form class="settings-panel" aria-labelledby="track-options-title">
      <header><div><small>TRACK · LIVE SETUP</small><h2 id="track-options-title">TRACK OPTIONS</h2></div><button type="button" data-close aria-label="Schließen">×</button></header>
      <p>Die Gate-Größe wird unmittelbar auf den aktuellen Track angewendet.</p>
      <div class="settings-grid settings-grid--single">
        <label><span>Gate-Größe</span><output>${settings.gateSize.toFixed(2)}×</output><input name="gateSize" type="range" min="${MIN_GATE_SIZE}" max="${MAX_GATE_SIZE}" step="${GATE_SIZE_STEP}" value="${settings.gateSize}"></label>
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
      const gateSize = Number(new FormData(form).get("gateSize"));
      settings = { ...settings, gateSize };
      const output = this.element.querySelector<HTMLOutputElement>("output");
      if (output) output.textContent = `${gateSize.toFixed(2)}×`;
      this.apply(settings);
    });
  }
}
