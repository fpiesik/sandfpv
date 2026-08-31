import "./style.css";
import { FixedTimestep } from "./core/FixedTimestep";
import { ControllerInspector } from "./input/ControllerInspector";
import { GamepadManager } from "./input/GamepadManager";
import { Scene } from "./render/Scene";
import { createPhysicsWorld } from "./simulation/PhysicsWorld";

async function start(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>("#simulator");
  if (!canvas) throw new Error("Simulator canvas is missing");
  const inspectorElement = document.querySelector<HTMLElement>("#controllers");
  if (!inspectorElement) throw new Error("Controller inspector is missing");

  const view = new Scene(canvas);
  const gamepadManager = new GamepadManager();
  const controllerInspector = new ControllerInspector(inspectorElement);
  gamepadManager.subscribe((gamepads) => controllerInspector.render(gamepads));
  const { world, cube } = await createPhysicsWorld();
  const physicsLoop = new FixedTimestep(120);
  let previousTime = performance.now();
  document.querySelector<HTMLElement>("#loading")?.setAttribute("hidden", "");

  const frame = (time: number): void => {
    gamepadManager.update();
    physicsLoop.advance((time - previousTime) / 1000, (stepSeconds) => {
      world.timestep = stepSeconds;
      world.step();
    });
    previousTime = time;

    const position = cube.body.translation();
    const rotation = cube.body.rotation();
    view.cube.position.set(position.x, position.y, position.z);
    view.cube.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    view.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

void start();
