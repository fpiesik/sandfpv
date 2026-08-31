import { describe, expect, it } from "vitest";
import { CalibrationWizard } from "./CalibrationWizard";
import type { GamepadSnapshot } from "./GamepadManager";

class RootStub {
  innerHTMLWrites = 0;
  private markup = "";
  private readonly attributes = new Set(["hidden"]);

  set innerHTML(value: string) {
    this.markup = value;
    this.innerHTMLWrites++;
  }

  get innerHTML(): string {
    return this.markup;
  }

  addEventListener(): void {}
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

describe("CalibrationWizard", () => {
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
});
