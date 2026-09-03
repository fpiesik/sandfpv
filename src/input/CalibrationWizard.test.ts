import { afterEach, describe, expect, it, vi } from "vitest";
import { CalibrationWizard } from "./CalibrationWizard";
import type { GamepadSnapshot } from "./GamepadManager";
import {
  INPUT_CONFIGURATION_VERSION,
  type InputConfiguration,
} from "./InputConfiguration";

class RootStub {
  innerHTMLWrites = 0;
  clickListener?: (event: Event) => void;
  private markup = "";
  private readonly attributes = new Set(["hidden"]);

  set innerHTML(value: string) {
    this.markup = value;
    this.innerHTMLWrites++;
  }

  get innerHTML(): string {
    return this.markup;
  }

  addEventListener(name: string, listener: EventListener): void {
    if (name === "click") this.clickListener = listener;
  }
  querySelector(): null {
    return null;
  }
  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }
  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }
  setAttribute(name: string): void {
    this.attributes.add(name);
  }
}

const configuration: InputConfiguration = {
  version: INPUT_CONFIGURATION_VERSION,
  gamepadId: "controller",
  resetButton: 7,
  axes: Object.fromEntries(
    ["throttle", "yaw", "pitch", "roll"].map((name, axis) => [
      name,
      {
        axis,
        minimum: -1,
        maximum: 1,
        center: 0,
        inverted: axis === 2,
        deadband: 0.05,
      },
    ]),
  ) as InputConfiguration["axes"],
};

const click = (root: RootStub, action: string): void =>
  root.clickListener?.({
    target: { closest: () => ({ dataset: { action } }) },
  } as unknown as Event);

describe("CalibrationWizard", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does not replace its controls for every live gamepad sample", () => {
    let listener: (gamepads: readonly GamepadSnapshot[]) => void = () => {};
    const manager = {
      subscribe(next: typeof listener) {
        listener = next;
        next([]);
        return () => {};
      },
    };
    const root = new RootStub();
    const wizard = new CalibrationWizard(
      root as unknown as HTMLElement,
      manager as never,
      () => {},
    );
    const snapshot = (axis: number): GamepadSnapshot => ({
      id: "controller",
      index: 0,
      mapping: "standard",
      axes: [axis],
      buttons: [],
      timestamp: axis,
    });

    listener([snapshot(0)]);
    wizard.open();
    listener([snapshot(0.1)]);
    const initialWrites = root.innerHTMLWrites;
    listener([snapshot(0.2)]);
    expect(root.innerHTMLWrites).toBe(initialWrites);

    listener([snapshot(0.5)]);
    const detectedWrites = root.innerHTMLWrites;
    listener([snapshot(0.8)]);
    listener([snapshot(1)]);
    expect(root.innerHTMLWrites).toBe(detectedWrites);
  });

  it("skips axis assignment without changing it and maps reset on demand", () => {
    let listener: (gamepads: readonly GamepadSnapshot[]) => void = () => {};
    const manager = {
      subscribe(next: typeof listener) {
        listener = next;
        next([]);
        return () => {};
      },
    };
    const root = new RootStub();
    new CalibrationWizard(
      root as unknown as HTMLElement,
      manager as never,
      () => {},
      configuration,
    ).open();
    const snapshot = (pressedButton?: number): GamepadSnapshot => ({
      id: "controller",
      index: 0,
      mapping: "standard",
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 8 }, (_, index) => ({
        pressed: index === pressedButton,
        touched: index === pressedButton,
        value: index === pressedButton ? 1 : 0,
      })),
      timestamp: pressedButton ?? 0,
    });

    listener([snapshot()]);
    expect(root.innerHTML).toContain("Nur Invertierung einstellen");
    click(root, "skip-axes");
    expect(root.innerHTML).toContain("Throttle · Achse 0");
    expect(root.innerHTML).toContain('data-invert="pitch" checked');
    expect(root.innerHTML).toContain("Aktuell Button 7");

    listener([snapshot(3)]);
    expect(root.innerHTML).toContain("Aktuell Button 7");
    click(root, "map-reset");
    listener([snapshot(3)]);
    expect(root.innerHTML).toContain("Aktuell Button 3");
  });

  it("saves an initial calibration without assigning a reset button", () => {
    let listener: (gamepads: readonly GamepadSnapshot[]) => void = () => {};
    const manager = {
      subscribe(next: typeof listener) {
        listener = next;
        next([]);
        return () => {};
      },
    };
    const saved: InputConfiguration[] = [];
    const root = new RootStub();
    vi.stubGlobal("localStorage", { setItem: vi.fn() });
    const wizard = new CalibrationWizard(
      root as unknown as HTMLElement,
      manager as never,
      (next) => saved.push(next),
    );
    const values = [0, 0, 0, 0];
    const snapshot = (): GamepadSnapshot => ({
      id: "controller",
      index: 0,
      mapping: "standard",
      axes: values,
      buttons: [],
      timestamp: values.reduce((sum, value) => sum + value, 0),
    });

    wizard.open();
    listener([snapshot()]);
    for (let axis = 0; axis < values.length; axis++) {
      values[axis] = 0.8;
      listener([snapshot()]);
      click(root, "next");
    }

    expect(root.innerHTML).toContain("Reset-Taste (optional)");
    expect(root.innerHTML).toMatch(/data-action="next"\s*>Speichern/);
    click(root, "next");

    expect(saved).toHaveLength(1);
    expect(saved[0].resetButton).toBeUndefined();
    expect(root.hasAttribute("hidden")).toBe(true);
  });
});
