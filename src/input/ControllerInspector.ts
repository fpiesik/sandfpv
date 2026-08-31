import type { GamepadSnapshot } from "./GamepadManager";

export class ControllerInspector {
  constructor(private readonly root: HTMLElement) {}

  render(gamepads: readonly GamepadSnapshot[]): void {
    if (gamepads.length === 0) {
      this.root.innerHTML = `
        <div class="controller-empty">
          <span class="controller-empty__icon" aria-hidden="true">＋</span>
          <strong>Kein Controller</strong>
          <small>Gamepad verbinden und eine Taste drücken</small>
        </div>`;
      return;
    }

    this.root.innerHTML = gamepads
      .map((gamepad) => this.card(gamepad))
      .join("");
  }

  private card(gamepad: GamepadSnapshot): string {
    const mapping = gamepad.mapping || "none";
    const axes = gamepad.axes
      .map((value, index) => {
        const normalized = Math.max(-1, Math.min(1, value));
        const width = Math.abs(normalized) * 50;
        const left = normalized < 0 ? 50 - width : 50;
        return `
          <div class="axis">
            <div class="axis__label"><span>ACHSE ${index}</span><output>${value.toFixed(3)}</output></div>
            <div class="axis__track" role="meter" aria-label="Achse ${index}" aria-valuemin="-1" aria-valuemax="1" aria-valuenow="${normalized}">
              <span class="axis__center"></span>
              <span class="axis__value" style="left:${left}%;width:${width}%"></span>
            </div>
          </div>`;
      })
      .join("");
    const buttons = gamepad.buttons
      .map(
        (button, index) => `
          <div class="button ${button.pressed ? "button--pressed" : ""}" title="Button ${index}: ${button.value.toFixed(2)}">
            <span>${index}</span><small>${button.value.toFixed(2)}</small>
          </div>`,
      )
      .join("");

    return `
      <article class="controller-card">
        <header>
          <span class="controller-card__status"></span>
          <div><strong>${this.escape(gamepad.id)}</strong><small>INDEX ${gamepad.index}</small></div>
        </header>
        <dl class="controller-meta">
          <div><dt>MAPPING</dt><dd>${this.escape(mapping)}</dd></div>
          <div><dt>BUTTONS</dt><dd>${gamepad.buttons.length}</dd></div>
          <div><dt>ACHSEN</dt><dd>${gamepad.axes.length}</dd></div>
        </dl>
        <section><h3>ACHSEN</h3>${axes || '<p class="controller-note">Keine Achsen</p>'}</section>
        <section><h3>BUTTONS</h3><div class="buttons">${buttons || '<p class="controller-note">Keine Buttons</p>'}</div></section>
      </article>`;
  }

  private escape(value: string): string {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
  }
}
