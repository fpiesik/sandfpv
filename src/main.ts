import "./style.css";
import { FixedTimestep } from "./core/FixedTimestep";
import { ControllerInspector } from "./input/ControllerInspector";
import { CalibrationWizard } from "./input/CalibrationWizard";
import { GamepadInput } from "./input/GamepadInput";
import { GamepadManager } from "./input/GamepadManager";
import { loadInputConfiguration } from "./input/InputConfiguration";
import { KeyboardInput } from "./input/KeyboardInput";
import { Scene } from "./render/Scene";
import { createPhysicsWorld } from "./simulation/PhysicsWorld";
import { DroneConfigurationPanel } from "./simulation/DroneConfiguration";
import { FlightDebugPanel } from "./simulation/FlightDebugPanel";
import type { ControlState } from "./input/InputSource";
import { stickPositions } from "./input/StickVisualizer";

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
  const keyboardInput = new KeyboardInput();
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
  const { world, drone } = await createPhysicsWorld();
  const debugElement = document.querySelector<HTMLElement>("#flight-debug");
  if (!debugElement) throw new Error("Flight debug panel is missing");
  const flightDebug = new FlightDebugPanel(debugElement);
  const droneConfigurationElement = document.querySelector<HTMLElement>(
    "#drone-configuration",
  );
  if (!droneConfigurationElement)
    throw new Error("Drone configuration panel is missing");
  const droneConfiguration = new DroneConfigurationPanel(
    droneConfigurationElement,
    drone,
  );
  document
    .querySelector("#configure-drone")
    ?.addEventListener("click", () => droneConfiguration.open());
  const reset = (): void => drone.reset();
  document.querySelector("#reset")?.addEventListener("click", reset);
  addEventListener("keydown", (event) => {
    if (event.code === "KeyR" && !event.repeat) reset();
    if (event.code === "KeyC" && !event.repeat)
      setCameraMode(view.toggleCamera());
    if (event.code === "KeyV" && !event.repeat)
      document
        .querySelector("#stick-visualizer")
        ?.classList.toggle("sticks--hidden");
  });
  const cameraAngle = requireInput("camera-angle");
  const cameraFov = requireInput("camera-fov");
  const configureCamera = (): void => {
    const angle = Number(cameraAngle.value);
    const fov = Number(cameraFov.value);
    view.configureFpvCamera({ angle, fov });
    setText("camera-angle-value", `${angle}°`);
    setText("camera-fov-value", `${fov}°`);
  };
  cameraAngle.addEventListener("input", configureCamera);
  cameraFov.addEventListener("input", configureCamera);
  const setCameraMode = (mode: "fpv" | "debug"): void =>
    setText("camera-mode", mode.toUpperCase());
  document
    .querySelector("#toggle-camera")
    ?.addEventListener("click", () => setCameraMode(view.toggleCamera()));
  const physicsLoop = new FixedTimestep(120);
  let previousTime = performance.now();
  let fps = 60;
  document.querySelector<HTMLElement>("#loading")?.setAttribute("hidden", "");

  const frame = (time: number): void => {
    const frameMilliseconds = time - previousTime;
    gamepadInput.update();
    keyboardInput.update();
    const controls = combineControls(gamepadInput.read(), keyboardInput.read());
    physicsLoop.advance((time - previousTime) / 1000, (stepSeconds) => {
      drone.update(controls.throttle, stepSeconds, {
        roll: controls.roll,
        pitch: controls.pitch,
        yaw: controls.yaw,
      });
      world.timestep = stepSeconds;
      world.step();
    });
    previousTime = time;

    const position = drone.body.translation();
    const rotation = drone.body.rotation();
    view.drone.position.set(position.x, position.y, position.z);
    view.drone.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    view.render();
    fps += (1000 / Math.max(frameMilliseconds, 1) - fps) * 0.08;
    renderHud(controls, fps);
    flightDebug.render(drone.flightControllerDebug);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function combineControls(
  first: ControlState,
  second: ControlState,
): ControlState {
  return {
    throttle: Math.max(first.throttle, second.throttle),
    roll: strongest(first.roll, second.roll),
    pitch: strongest(first.pitch, second.pitch),
    yaw: strongest(first.yaw, second.yaw),
  };
}

function renderHud(controls: ControlState, fps: number): void {
  setText("hud-throttle", `${Math.round(controls.throttle * 100)}%`);
  setText("hud-roll", signed(controls.roll));
  setText("hud-pitch", signed(controls.pitch));
  setText("hud-yaw", signed(controls.yaw));
  setText("hud-fps", `${Math.round(fps)} FPS`);
  const sticks = stickPositions(controls);
  positionStick("left-stick", sticks.left.x, sticks.left.y);
  positionStick("right-stick", sticks.right.x, sticks.right.y);
}

function positionStick(id: string, x: number, y: number): void {
  const element = document.getElementById(id);
  if (element)
    element.style.transform = `translate(calc(-50% + ${x * 30}px), calc(-50% + ${y * 30}px))`;
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}
function setText(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}
function requireInput(id: string): HTMLInputElement {
  const input = document.getElementById(id);
  if (!(input instanceof HTMLInputElement)) throw new Error(`${id} is missing`);
  return input;
}

function strongest(first: number, second: number): number {
  return Math.abs(first) >= Math.abs(second) ? first : second;
}

void start();
