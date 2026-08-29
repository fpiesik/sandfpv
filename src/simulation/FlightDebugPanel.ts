import type { FlightControllerDebug } from "./Drone";

export class FlightDebugPanel {
  constructor(private readonly root: HTMLElement) {}

  render(debug: Readonly<FlightControllerDebug>): void {
    this.root.innerHTML = `<div class="flight-debug__title">ACRO RATE DEBUG <span>LOCAL AXES</span></div>
      ${row("DESIRED", debug.desiredRates, "rad/s")}
      ${row("ACTUAL", debug.actualRates, "rad/s")}
      ${row("TORQUE", debug.torques, "Nm")}`;
  }
}

function row(
  label: string,
  vector: { x: number; y: number; z: number },
  unit: string,
): string {
  return `<div class="flight-debug__row"><strong>${label}</strong><span>R ${format(vector.x)}</span><span>P ${format(vector.z)}</span><span>Y ${format(vector.y)}</span><small>${unit}</small></div>`;
}

function format(value: number): string {
  return (Math.abs(value) < 0.0005 ? 0 : value).toFixed(2);
}
