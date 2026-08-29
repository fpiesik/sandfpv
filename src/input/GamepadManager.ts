export interface GamepadSnapshot {
  readonly id: string;
  readonly index: number;
  readonly mapping: GamepadMappingType;
  readonly axes: readonly number[];
  readonly buttons: readonly GamepadButtonSnapshot[];
  readonly timestamp: number;
}

export interface GamepadButtonSnapshot {
  readonly pressed: boolean;
  readonly touched: boolean;
  readonly value: number;
}

type GamepadListener = (gamepads: readonly GamepadSnapshot[]) => void;

/**
 * The single access point for controller input in the simulator.
 * Call update once per animation frame before reading controller state.
 */
export class GamepadManager {
  private readonly gamepads = new Map<number, GamepadSnapshot>();
  private readonly listeners = new Set<GamepadListener>();

  constructor() {
    addEventListener("gamepadconnected", this.handleConnectionChange);
    addEventListener("gamepaddisconnected", this.handleConnectionChange);
    this.update();
  }

  get connectedGamepads(): readonly GamepadSnapshot[] {
    return [...this.gamepads.values()].sort((a, b) => a.index - b.index);
  }

  get(index: number): GamepadSnapshot | undefined {
    return this.gamepads.get(index);
  }

  subscribe(listener: GamepadListener): () => void {
    this.listeners.add(listener);
    listener(this.connectedGamepads);
    return () => this.listeners.delete(listener);
  }

  update(): void {
    const next = new Map<number, GamepadSnapshot>();
    for (const gamepad of navigator.getGamepads()) {
      if (!gamepad?.connected) continue;
      next.set(gamepad.index, this.snapshot(gamepad));
    }

    this.gamepads.clear();
    for (const [index, gamepad] of next) this.gamepads.set(index, gamepad);
    this.notify();
  }

  destroy(): void {
    removeEventListener("gamepadconnected", this.handleConnectionChange);
    removeEventListener("gamepaddisconnected", this.handleConnectionChange);
    this.listeners.clear();
    this.gamepads.clear();
  }

  private readonly handleConnectionChange = (): void => this.update();

  private snapshot(gamepad: Gamepad): GamepadSnapshot {
    return {
      id: gamepad.id,
      index: gamepad.index,
      mapping: gamepad.mapping,
      axes: Array.from(gamepad.axes),
      buttons: gamepad.buttons.map(({ pressed, touched, value }) => ({
        pressed,
        touched,
        value,
      })),
      timestamp: gamepad.timestamp,
    };
  }

  private notify(): void {
    const current = this.connectedGamepads;
    for (const listener of this.listeners) listener(current);
  }
}
