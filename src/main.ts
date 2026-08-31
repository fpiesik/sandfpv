import "./style.css";
import { FixedTimestep } from "./core/FixedTimestep";
import { Scene } from "./render/Scene";
import { createPhysicsWorld } from "./simulation/PhysicsWorld";

async function start(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>("#simulator");
  if (!canvas) throw new Error("Simulator canvas is missing");

  const view = new Scene(canvas);
  const { world, cube } = await createPhysicsWorld();
  const physicsLoop = new FixedTimestep(120);
  let previousTime = performance.now();
  document.querySelector<HTMLElement>("#loading")?.setAttribute("hidden", "");

  const frame = (time: number): void => {
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
