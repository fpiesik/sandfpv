import "./style.css";
import { FixedTimestep } from "./core/FixedTimestep";
import { GateCourse } from "./course/GateCourse";
import { ControllerInspector } from "./input/ControllerInspector";
import { CalibrationWizard } from "./input/CalibrationWizard";
import { GamepadInput } from "./input/GamepadInput";
import { GamepadManager } from "./input/GamepadManager";
import { loadInputConfiguration } from "./input/InputConfiguration";
import { Scene } from "./render/Scene";
import { createPhysicsWorld } from "./simulation/PhysicsWorld";
import { FlightController } from "./simulation/FlightController";
import { GateCollisionTracker } from "./simulation/GateCollisionTracker";
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
  const { world, drone, gateSensors } = await createPhysicsWorld(tuning);
  const gateReadout = document.querySelector<HTMLElement>("#gate-state");
  const lapReadout = document.querySelector<HTMLElement>("#lap-state");
  const course = new GateCourse(gateSensors.length, (nextGate, laps) => {
    view.setExpectedGate(nextGate);
    if (gateReadout)
      gateReadout.textContent = `${nextGate + 1} / ${gateSensors.length}`;
    if (lapReadout) lapReadout.textContent = String(laps);
  });
  const gateCollisions = new GateCollisionTracker(
    world,
    drone.collider,
    gateSensors,
  );
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
  const fpsReadout = document.querySelector<HTMLElement>("#fps");
  const cameraMode = document.querySelector<HTMLElement>("#camera-mode");
  const crosshair = document.querySelector<HTMLElement>("#crosshair");
  const angleInput = document.querySelector<HTMLInputElement>("#camera-angle");
  const fovInput = document.querySelector<HTMLInputElement>("#camera-fov");
  const stickVisualizer =
    document.querySelector<HTMLElement>("#stick-visualizer");
  const showSticks = document.querySelector<HTMLInputElement>("#show-sticks");
  const reset = (): void => {
    drone.reset();
    flightController.reset();
    gateCollisions.reset();
    course.reset();
  };
  const debugReadout = document.querySelector<HTMLElement>("#flight-debug");
  document.querySelector("#reset")?.addEventListener("click", reset);
  const updateCameraSettings = (): void => {
    const angle = Number(angleInput?.value ?? 20);
    const fov = Number(fovInput?.value ?? 95);
    view.setFpvSettings(angle, fov);
    document.querySelector("#camera-angle-value")!.textContent = `${angle}°`;
    document.querySelector("#camera-fov-value")!.textContent = `${fov}°`;
  };
  angleInput?.addEventListener("input", updateCameraSettings);
  fovInput?.addEventListener("input", updateCameraSettings);
  updateCameraSettings();
  showSticks?.addEventListener("change", () => {
    stickVisualizer?.toggleAttribute("hidden", !showSticks.checked);
  });
  const toggleCamera = (): void => {
    const fpvActive = view.toggleCamera();
    if (cameraMode) cameraMode.textContent = fpvActive ? "FPV" : "DEBUG";
    crosshair?.toggleAttribute("hidden", !fpvActive);
  };
  addEventListener("keydown", ({ code, repeat }) => {
    if (repeat) return;
    if (code === "KeyC") toggleCamera();
    if (code === "KeyR") reset();
  });
  const physicsLoop = new FixedTimestep(120);
  let previousTime = performance.now();
  let smoothedFps = 60;
  let cameraButtonPressed = false;
  document.querySelector<HTMLElement>("#loading")?.setAttribute("hidden", "");

  const frame = (time: number): void => {
    gamepadInput.update();
    const controls = gamepadInput.read();
    const cameraButtonNow = gamepadManager.connectedGamepads.some(
      (gamepad) => gamepad.buttons[9]?.pressed,
    );
    if (cameraButtonNow && !cameraButtonPressed) toggleCamera();
    cameraButtonPressed = cameraButtonNow;
    physicsLoop.advance((time - previousTime) / 1000, (stepSeconds) => {
      drone.applyThrottle(controls.throttle, stepSeconds);
      flightController.update(controls, stepSeconds);
      world.timestep = stepSeconds;
      world.step();
      gateCollisions.update((gateIndex) => course.pass(gateIndex));
    });
    smoothedFps +=
      (1000 / Math.max(1, time - previousTime) - smoothedFps) * 0.08;
    previousTime = time;

    const position = drone.body.translation();
    const rotation = drone.body.rotation();
    view.drone.position.set(position.x, position.y, position.z);
    view.drone.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    if (motorReadout)
      motorReadout.textContent = `${Math.round(drone.currentMotorThrottle * 100)}%`;
    if (fpsReadout) fpsReadout.textContent = smoothedFps.toFixed(0);
    const signed = (value: number): string =>
      `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
    for (const [name, value] of Object.entries(controls)) {
      if (name === "selfLevel" || name === "throttle") continue;
      const readout = document.querySelector<HTMLElement>(`#hud-${name}`);
      if (readout) readout.textContent = signed(value as number);
    }
    const moveStick = (selector: string, x: number, y: number): void => {
      const stick = document.querySelector<HTMLElement>(selector);
      if (stick) stick.style.transform = `translate(${x * 26}px, ${-y * 26}px)`;
    };
    moveStick("#left-stick", controls.yaw, controls.throttle * 2 - 1);
    moveStick("#right-stick", controls.roll, controls.pitch);
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
