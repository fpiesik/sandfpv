import "./style.css";
import { FixedTimestep } from "./core/FixedTimestep";
import { ControllerInspector } from "./input/ControllerInspector";
import { CalibrationWizard } from "./input/CalibrationWizard";
import { GamepadInput } from "./input/GamepadInput";
import { GamepadManager } from "./input/GamepadManager";
import { loadInputConfiguration } from "./input/InputConfiguration";
import { Scene } from "./render/Scene";
import {
  FIRST_GATES,
  createFirstGatesLesson,
  type GateLessonEvent,
} from "./lesson/FirstGatesLesson";
import { LessonPanel } from "./lesson/LessonPanel";
import { createPhysicsWorld } from "./simulation/PhysicsWorld";
import { CrashTracker } from "./simulation/CrashTracker";
import { FlightController } from "./simulation/FlightController";
import { GateCollisionTracker } from "./simulation/GateCollisionTracker";
import { GateCourse } from "./course/GateCourse";
import { LapTimer } from "./course/LapTimer";
import {
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
  type FlightMode,
} from "./settings/AppSettings";
import { SettingsPanel } from "./settings/SettingsPanel";
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
  let settings = loadAppSettings();
  gamepadInput.setDeadband(settings.deadband);
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
  const { world, drone, gateSensors, setGateSize } =
    await createPhysicsWorld(tuning);
  const gateReadout = document.querySelector<HTMLElement>("#gate-state");
  const lapReadout = document.querySelector<HTMLElement>("#lap-state");
  const lessonElement = document.querySelector<HTMLElement>("#lesson");
  if (!lessonElement) throw new Error("Lesson panel is missing");
  const lesson = createFirstGatesLesson();
  const lessonPanel = new LessonPanel<GateLessonEvent>(lessonElement);
  lesson.start();
  lessonPanel.render(lesson.state);
  const lapTimer = new LapTimer();
  const raceCourse = new GateCourse(5, (nextGate) =>
    view.setExpectedGate(nextGate),
  );
  const gateCollisions = new GateCollisionTracker(
    world,
    drone.collider,
    gateSensors,
  );
  const crashTracker = new CrashTracker(world, drone.collider);
  const flightController = new FlightController(drone);
  const tuningElement = document.querySelector<HTMLElement>("#tuning");
  if (!tuningElement) throw new Error("Drone tuning panel is missing");
  const tuningPanel = new DroneTuningPanel(tuningElement, (next) => {
    tuning = next;
    drone.applyConfig(next);
    saveDroneTuning(next);
  });
  const settingsElement = document.querySelector<HTMLElement>("#settings");
  if (!settingsElement) throw new Error("Settings panel is missing");
  const stickVisualizer =
    document.querySelector<HTMLElement>("#stick-visualizer");
  const applySettings = (next: AppSettings): void => {
    settings = next;
    gamepadInput.setDeadband(next.deadband);
    view.setFpvSettings(next.cameraAngle, next.fov);
    view.setGateSize(next.gateSize);
    setGateSize(next.gateSize);
    stickVisualizer?.toggleAttribute("hidden", !next.showStickVisualizer);
    saveAppSettings(next);
  };
  const settingsPanel = new SettingsPanel(settingsElement, applySettings);
  document
    .querySelector("#open-settings")
    ?.addEventListener("click", () => settingsPanel.open(settings));
  applySettings(settings);
  document
    .querySelector("#open-tuning")
    ?.addEventListener("click", () => tuningPanel.open(tuning));
  const motorReadout = document.querySelector<HTMLElement>("#motor-state");
  const fpsReadout = document.querySelector<HTMLElement>("#fps");
  const cameraMode = document.querySelector<HTMLElement>("#camera-mode");
  const crosshair = document.querySelector<HTMLElement>("#crosshair");
  const lessonContainer = document.querySelector<HTMLElement>("#lesson")!;
  const racePanel = document.querySelector<HTMLElement>("#race-panel")!;
  let mode: FlightMode = settings.mode;
  const setMode = (nextMode: FlightMode): void => {
    mode = nextMode;
    settings = { ...settings, mode };
    saveAppSettings(settings);
    lesson.reset();
    lesson.start();
    raceCourse.reset();
    lapTimer.reset();
    lessonContainer.hidden = mode !== "first-gates";
    racePanel.hidden = mode !== "race";
    document
      .querySelectorAll<HTMLElement>("[data-mode]")
      .forEach((button) =>
        button.classList.toggle("active", button.dataset.mode === mode),
      );
    if (mode === "first-gates") view.setExpectedGate(FIRST_GATES[0]);
    else if (mode === "race") view.setExpectedGate(0);
    else view.clearExpectedGate();
  };
  document
    .querySelectorAll<HTMLElement>("[data-mode]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        setMode(button.dataset.mode as FlightMode),
      ),
    );
  const reset = (): void => {
    if (mode === "first-gates") lesson.recordCrash();
    drone.reset();
    flightController.reset();
    gateCollisions.reset();
    crashTracker.reset();
    raceCourse.reset();
    lapTimer.reset();
    lessonPanel.render(lesson.state);
    if (mode === "first-gates")
      view.setExpectedGate(FIRST_GATES[lesson.state.stepIndex]);
    else if (mode === "free-flight") view.clearExpectedGate();
  };
  const debugReadout = document.querySelector<HTMLElement>("#flight-debug");
  document.querySelector("#reset")?.addEventListener("click", reset);
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
  setMode(mode);

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
      const velocity = drone.body.linvel();
      const impactSpeed = Math.hypot(velocity.x, velocity.y, velocity.z);
      world.step();
      crashTracker.update(impactSpeed, () => {
        if (mode === "first-gates") lesson.recordCrash();
      });
      gateCollisions.update((gateIndex) => {
        if (mode === "first-gates") {
          lesson.update(0, [{ type: "gate-passed", gateIndex }]);
          const state = lesson.state;
          if (state.status === "completed") view.clearExpectedGate();
          else view.setExpectedGate(FIRST_GATES[state.stepIndex]);
        } else if (mode === "race" && gateIndex === raceCourse.expectedGate) {
          if (gateIndex === 0 && !lapTimer.running) lapTimer.start(time / 1000);
          const previousLaps = raceCourse.laps;
          raceCourse.pass(gateIndex);
          if (raceCourse.laps > previousLaps) lapTimer.finish(time / 1000);
        }
      });
    });
    lesson.update((time - previousTime) / 1000);
    const lessonState = lesson.state;
    lessonPanel.render(lessonState);
    if (mode === "race") lapTimer.update(time / 1000);
    if (gateReadout)
      gateReadout.textContent =
        mode === "race"
          ? `${raceCourse.expectedGate + 1} / 5`
          : mode === "first-gates"
            ? `${Math.min(lessonState.stepIndex + 1, 3)} / 3`
            : "–";
    if (lapReadout)
      lapReadout.textContent =
        mode === "race"
          ? String(raceCourse.laps)
          : lessonState.status === "completed"
            ? "✓"
            : "–";
    const formatRaceTime = (seconds?: number): string =>
      seconds === undefined
        ? "–"
        : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}.${String(Math.floor((seconds % 1) * 1000)).padStart(3, "0")}`;
    document.querySelector<HTMLElement>("#race-time")!.textContent =
      formatRaceTime(lapTimer.elapsedSeconds);
    document.querySelector<HTMLElement>("#best-time")!.textContent =
      formatRaceTime(lapTimer.best);
    document.querySelector<HTMLElement>("#race-laps")!.textContent = String(
      raceCourse.laps,
    );
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
