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
  });
  const physicsLoop = new FixedTimestep(120);
  let previousTime = performance.now();
  document.querySelector<HTMLElement>("#loading")?.setAttribute("hidden", "");

  const frame = (time: number): void => {
    gamepadInput.update();
    keyboardInput.update();
    physicsLoop.advance((time - previousTime) / 1000, (stepSeconds) => {
      const gamepadControls = gamepadInput.read();
      const keyboardControls = keyboardInput.read();
      drone.update(
        Math.max(gamepadControls.throttle, keyboardControls.throttle),
        stepSeconds,
      );
      world.timestep = stepSeconds;
      world.step();
    });
    previousTime = time;

    const position = drone.body.translation();
    const rotation = drone.body.rotation();
    view.drone.position.set(position.x, position.y, position.z);
    view.drone.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    view.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

void start();
