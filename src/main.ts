import "./style.css";
import { FixedTimestep } from "./core/FixedTimestep";
import { ControllerInspector } from "./input/ControllerInspector";
import { CalibrationWizard } from "./input/CalibrationWizard";
import { GamepadInput } from "./input/GamepadInput";
import { GamepadManager } from "./input/GamepadManager";
import { loadInputConfiguration } from "./input/InputConfiguration";
import { Scene } from "./render/Scene";
import { createPhysicsWorld } from "./simulation/PhysicsWorld";
import { FlightController } from "./simulation/FlightController";
import {
  DroneTuningPanel,
  loadDroneTuning,
  saveDroneTuning,
} from "./simulation/DroneTuning";

async function start(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>("#simulator");
  if (!canvas) throw new Error("Simulator canvas is missing");
  const inspectorElement = document.querySelector<HTMLElement>("#controllers");
  if (!inspectorElement) throw new Error("Controller inspector is missing");

  const view = new Scene(canvas);
  const gamepadManager = new GamepadManager();
  const gamepadInput = new GamepadInput(
    gamepadManager,
    loadInputConfiguration(),
  );
  const controllerInspector = new ControllerInspector(inspectorElement);
  gamepadManager.subscribe((gamepads) => controllerInspector.render(gamepads));
  const wizardElement = document.querySelector<HTMLElement>("#calibration");
  if (!wizardElement) throw new Error("Calibration wizard is missing");
  const wizard = new CalibrationWizard(
    wizardElement,
    gamepadManager,
    (configuration) => gamepadInput.setConfiguration(configuration),
  );
  document
    .querySelector("#calibrate")
    ?.addEventListener("click", () => wizard.open());
  let tuning = loadDroneTuning();
  const { world, drone } = await createPhysicsWorld(tuning);
  const flightController = new FlightController(drone);
  const tuningElement = document.querySelector<HTMLElement>("#tuning");
  if (!tuningElement) throw new Error("Drone tuning panel is missing");
  const tuningPanel = new DroneTuningPanel(tuningElement, (next) => {
    tuning = next;
    drone.applyConfig(next);
    saveDroneTuning(next);
  });
  document
    .querySelector("#open-tuning")
    ?.addEventListener("click", () => tuningPanel.open(tuning));
  const motorReadout = document.querySelector<HTMLElement>("#motor-state");
  const debugReadout = document.querySelector<HTMLElement>("#flight-debug");
  document.querySelector("#reset")?.addEventListener("click", () => {
    drone.reset();
    flightController.reset();
  });
  const physicsLoop = new FixedTimestep(120);
  let previousTime = performance.now();
  document.querySelector<HTMLElement>("#loading")?.setAttribute("hidden", "");

  const frame = (time: number): void => {
    gamepadInput.update();
    const controls = gamepadInput.read();
    physicsLoop.advance((time - previousTime) / 1000, (stepSeconds) => {
      drone.applyThrottle(controls.throttle, stepSeconds);
      flightController.update(controls, stepSeconds);
      world.timestep = stepSeconds;
      world.step();
    });
    previousTime = time;

    const position = drone.body.translation();
    const rotation = drone.body.rotation();
    view.drone.position.set(position.x, position.y, position.z);
    view.drone.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    if (motorReadout)
      motorReadout.textContent = `${Math.round(drone.currentMotorThrottle * 100)}%`;
    if (debugReadout) {
      const debug = flightController.getDebug();
      const row = (value: { x: number; y: number; z: number }): string =>
        `${value.z.toFixed(2)} / ${value.x.toFixed(2)} / ${value.y.toFixed(2)}`;
      debugReadout.innerHTML = `<dt>MODE</dt><dd>${debug.mode}</dd><dt>DESIRED °/s</dt><dd>${row(debug.desiredRates).replace(/-?\d+\.\d+/g, (number) => ((Number(number) * 180) / Math.PI).toFixed(0))}</dd><dt>ACTUAL °/s</dt><dd>${row(debug.actualRates).replace(/-?\d+\.\d+/g, (number) => ((Number(number) * 180) / Math.PI).toFixed(0))}</dd><dt>TORQUE Nm</dt><dd>${row(debug.torque)}</dd>`;
    }
    view.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

void start();
