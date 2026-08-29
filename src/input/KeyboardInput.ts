import {
  NEUTRAL_CONTROLS,
  type ControlState,
  type InputSource,
} from "./InputSource";

export class KeyboardInput implements InputSource {
  readonly id = "keyboard";
  private readonly pressed = new Set<string>();
  private throttle = 0;

  constructor(private readonly target: Window = window) {
    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("blur", this.onBlur);
  }

  update(): void {
    const direction =
      Number(this.pressed.has("KeyW")) - Number(this.pressed.has("KeyS"));
    this.throttle = Math.min(1, Math.max(0, this.throttle + direction * 0.02));
  }

  read(): ControlState {
    return {
      ...NEUTRAL_CONTROLS,
      throttle: this.throttle,
      roll:
        Number(this.pressed.has("ArrowRight")) -
        Number(this.pressed.has("ArrowLeft")),
      pitch:
        Number(this.pressed.has("ArrowDown")) -
        Number(this.pressed.has("ArrowUp")),
      yaw: Number(this.pressed.has("KeyE")) - Number(this.pressed.has("KeyQ")),
    };
  }

  destroy(): void {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("blur", this.onBlur);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code)
    )
      event.preventDefault();
    this.pressed.add(event.code);
  };
  private readonly onKeyUp = (event: KeyboardEvent): void =>
    void this.pressed.delete(event.code);
  private readonly onBlur = (): void => this.pressed.clear();
}
