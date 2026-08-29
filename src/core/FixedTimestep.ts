/** Runs simulation updates at a stable rate independently of rendering. */
export class FixedTimestep {
  readonly stepSeconds: number;
  private accumulator = 0;

  constructor(
    hertz = 120,
    private readonly maxFrameSeconds = 0.25,
  ) {
    if (hertz <= 0) throw new RangeError("hertz must be greater than zero");
    this.stepSeconds = 1 / hertz;
  }

  advance(frameSeconds: number, update: (stepSeconds: number) => void): number {
    this.accumulator += Math.min(
      Math.max(frameSeconds, 0),
      this.maxFrameSeconds,
    );
    let steps = 0;
    while (this.accumulator >= this.stepSeconds) {
      update(this.stepSeconds);
      this.accumulator -= this.stepSeconds;
      steps++;
    }
    return steps;
  }
}
