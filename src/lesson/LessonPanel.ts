import type { LessonState } from "./Lesson";

/** DOM adapter kept separate from the reusable lesson state machine. */
export class LessonPanel<Event> {
  constructor(private readonly element: HTMLElement) {}

  render(state: LessonState<Event>): void {
    const step = state.definition.steps[state.stepIndex];
    const completed = state.status === "completed";
    this.element.classList.toggle("lesson-panel--complete", completed);
    this.element.innerHTML = `
      <header><small>LESSON</small><strong>${state.definition.title}</strong></header>
      ${
        completed
          ? `<div class="lesson-success" role="status"><b>✓ ERFOLG</b><span>${state.definition.successMessage}</span></div>`
          : `<div class="lesson-target"><small>AKTUELLES ZIEL</small><b>${step?.title ?? "Bereit"}</b><p>${step?.hint ?? ""}</p></div>`
      }
      <dl><div><dt>FORTSCHRITT</dt><dd>${Math.min(state.stepIndex, state.definition.steps.length)} / ${state.definition.steps.length}</dd></div><div><dt>CRASHES</dt><dd>${state.crashes}</dd></div><div><dt>ZEIT</dt><dd>${formatTime(state.elapsedSeconds)}</dd></div></dl>`;
  }
}

function formatTime(seconds: number): string {
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}
