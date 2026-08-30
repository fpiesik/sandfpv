import type { FlightControllerDebug } from "./Drone";

export class FlightDebugPanel {
  constructor(private readonly root: HTMLElement) {}

  render(debug: Readonly<FlightControllerDebug>, fps: number): void {
    this.root.innerHTML = `<div class="flight-debug__title">ACRO RATE DEBUG <span>LOCAL AXES</span></div>
      ${scalar("MASS / T:W", `${(debug.massKg * 1000).toFixed(1)} g / ${debug.thrustToWeightRatio.toFixed(1)}:1`)}
      ${scalar("THROTTLE / MOTOR", `${percent(debug.throttleInput)} / ${percent(debug.motorOutput)}`)}
      ${scalar("THRUST", `${debug.totalThrustN.toFixed(3)} N`)}
      ${row("STICK", debug.sticks, "norm")}
      ${row("DESIRED", debug.desiredRates, "rad/s")}
      ${row("ACTUAL", debug.actualRates, "rad/s")}
      ${row("TORQUE", debug.torques, "Nm")}
      ${row("LINEAR V", debug.linearVelocity, "m/s")}
      ${row("ANGULAR V", debug.angularVelocity, "rad/s")}
      ${row("INERTIA", debug.angularInertia, "kg·m²")}
      ${scalar("PHYSICS / FPS", `${Math.round(debug.physicsHz)} Hz / ${Math.round(fps)} FPS`)}`;
  }
}

function scalar(label: string, value: string): string {
  return `<div class="flight-debug__row"><strong>${label}</strong><span>${value}</span></div>`;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
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
