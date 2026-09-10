import "./style.css";
import { FixedTimestep } from "./core/FixedTimestep";
import { CalibrationWizard } from "./input/CalibrationWizard";
import { GamepadInput } from "./input/GamepadInput";
import { GamepadManager } from "./input/GamepadManager";
import { loadInputConfiguration } from "./input/InputConfiguration";
import { Scene, type FlightEnvironment } from "./render/Scene";
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

  const view = new Scene(canvas);
  const gamepadManager = new GamepadManager();
  const inputConfiguration = loadInputConfiguration();
  const gamepadInput = new GamepadInput(gamepadManager, inputConfiguration);
  let settings = loadAppSettings();
  gamepadInput.setDeadband(settings.deadband);
  const wizardElement = document.querySelector<HTMLElement>("#calibration");
  if (!wizardElement) throw new Error("Calibration wizard is missing");
  const wizard = new CalibrationWizard(
    wizardElement,
    gamepadManager,
    (configuration) => gamepadInput.setConfiguration(configuration),
    inputConfiguration,
  );
  document
    .querySelector("#menu-calibrate")
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
    view.setGraphics(next.resolutionScale, next.detailLevel);
    stickVisualizer?.toggleAttribute("hidden", !next.showStickVisualizer);
    saveAppSettings(next);
  };
  const settingsPanel = new SettingsPanel(settingsElement, applySettings);
  document
    .querySelector("#menu-open-settings")
    ?.addEventListener("click", () => settingsPanel.open(settings));
  applySettings(settings);
  document
    .querySelector("#menu-open-tuning")
    ?.addEventListener("click", () => tuningPanel.open(tuning));
  const motorReadout = document.querySelector<HTMLElement>("#motor-state");
  const fpsReadout = document.querySelector<HTMLElement>("#fps");
  const cameraMode = document.querySelector<HTMLElement>("#camera-mode");
  const cameraAngleReadout =
    document.querySelector<HTMLElement>("#camera-angle");
  const crosshair = document.querySelector<HTMLElement>("#crosshair");
  const lessonContainer = document.querySelector<HTMLElement>("#lesson")!;
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
    document
      .querySelectorAll<HTMLElement>("[data-mode]")
      .forEach((button) =>
        button.classList.toggle("active", button.dataset.mode === mode),
      );
    if (mode === "first-gates") view.setExpectedGate(FIRST_GATES[0]);
    else if (mode === "race") view.setExpectedGate(0);
    else view.clearExpectedGate();
  };
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
  document.querySelector("#reset")?.addEventListener("click", reset);
  const toggleCamera = (): void => {
    const fpvActive = view.toggleCamera();
    if (cameraMode) cameraMode.textContent = fpvActive ? "FPV" : "DEBUG";
    crosshair?.toggleAttribute("hidden", !fpvActive);
  };
  const menu = document.querySelector<HTMLElement>("#main-menu")!;
  const showMenuPage = (page: string): void => {
    menu.querySelectorAll<HTMLElement>(".menu-page").forEach((element) => {
      element.hidden = element.id !== `menu-${page}`;
    });
  };
  const openMenu = (): void => {
    document
      .querySelectorAll<HTMLElement>(".wizard-layer")
      .forEach((layer) => (layer.hidden = true));
    menu.hidden = false;
    document.body.classList.add("menu-open");
    showMenuPage("home");
  };
  const closeMenu = (): void => {
    menu.hidden = true;
    document.body.classList.remove("menu-open");
  };
  menu
    .querySelectorAll<HTMLElement>("[data-menu]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        showMenuPage(button.dataset.menu!),
      ),
    );
  document.querySelector("#start-flight")?.addEventListener("click", () => {
    const environment = document.querySelector<HTMLInputElement>(
      'input[name="environment"]:checked',
    )?.value as FlightEnvironment | undefined;
    view.setEnvironment(environment ?? "training-hall");
    const selected = document.querySelector<HTMLInputElement>(
      'input[name="flight-mode"]:checked',
    )?.value as FlightMode | undefined;
    setMode(selected ?? "free-flight");
    reset();
    closeMenu();
  });
  openMenu();
  const setCameraAngle = (cameraAngle: number): void => {
    settings = {
      ...settings,
      cameraAngle: Math.min(60, Math.max(0, cameraAngle)),
    };
    view.setFpvSettings(settings.cameraAngle, settings.fov);
    if (cameraAngleReadout)
      cameraAngleReadout.textContent = `${settings.cameraAngle}°`;
    saveAppSettings(settings);
  };
  setCameraAngle(settings.cameraAngle);
  addEventListener("keydown", (event) => {
    const { code, repeat } = event;
    const adjustsCameraAngle = code === "ArrowUp" || code === "ArrowDown";
    if (repeat && !adjustsCameraAngle) return;
    if (code === "Escape") {
      if (menu.hidden) openMenu();
      else showMenuPage("home");
      return;
    }
    if (!menu.hidden) return;
    if (adjustsCameraAngle) {
      event.preventDefault();
      setCameraAngle(settings.cameraAngle + (code === "ArrowUp" ? 1 : -1));
    }
    if (code === "KeyC") toggleCamera();
    if (code === "KeyR") reset();
  });
  const physicsLoop = new FixedTimestep(120);
  let previousTime = performance.now();
  let smoothedFps = 60;
  let cameraButtonPressed = false;
  let resetButtonPressed = false;
  document.querySelector<HTMLElement>("#loading")?.setAttribute("hidden", "");
  setMode(mode);

  const frame = (time: number): void => {
    gamepadInput.update();
    const controls = gamepadInput.read();
    if (controls.reset && !resetButtonPressed) reset();
    resetButtonPressed = controls.reset;
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
    document.querySelector<HTMLElement>("#last-time")!.textContent =
      formatRaceTime(lapTimer.last);
    smoothedFps +=
      (1000 / Math.max(1, time - previousTime) - smoothedFps) * 0.08;
    previousTime = time;

    const position = drone.body.translation();
    const velocity = drone.body.linvel();
    document.querySelector<HTMLElement>("#hud-speed")!.textContent = (
      Math.hypot(velocity.x, velocity.y, velocity.z) * 3.6
    ).toFixed(0);
    document.querySelector<HTMLElement>("#hud-altitude")!.textContent =
      Math.max(0, position.y).toFixed(1);
    const rotation = drone.body.rotation();
    view.drone.position.set(position.x, position.y, position.z);
    view.drone.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    if (motorReadout)
      motorReadout.textContent = `${Math.round(drone.currentMotorThrottle * 100)}%`;
    if (fpsReadout) fpsReadout.textContent = smoothedFps.toFixed(0);
    const signed = (value: number): string =>
      `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
    for (const [name, value] of Object.entries(controls)) {
      if (name === "reset" || name === "throttle") continue;
      const readout = document.querySelector<HTMLElement>(`#hud-${name}`);
      if (readout) readout.textContent = signed(value as number);
    }
    const moveStick = (selector: string, x: number, y: number): void => {
      const stick = document.querySelector<HTMLElement>(selector);
      if (stick) stick.style.transform = `translate(${x * 26}px, ${-y * 26}px)`;
    };
    moveStick("#left-stick", controls.yaw, controls.throttle * 2 - 1);
    moveStick("#right-stick", controls.roll, controls.pitch);
    view.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

void start();
