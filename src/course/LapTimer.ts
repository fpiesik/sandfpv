interface StoredTimes {
  readonly version: 1;
  readonly bestSeconds: number;
}
export const BEST_LAP_STORAGE_KEY = "sandfpv.best-lap.five-gates";

export class LapTimer {
  private startedAt?: number;
  private currentSeconds = 0;
  private bestSeconds?: number;

  constructor(private readonly storage: Storage = localStorage) {
    try {
      const saved = JSON.parse(
        storage.getItem(BEST_LAP_STORAGE_KEY) ?? "null",
      ) as StoredTimes | null;
      if (
        saved?.version === 1 &&
        Number.isFinite(saved.bestSeconds) &&
        saved.bestSeconds > 0
      )
        this.bestSeconds = saved.bestSeconds;
    } catch {
      /* Invalid local data is ignored. */
    }
  }

  get elapsedSeconds(): number {
    return this.currentSeconds;
  }
  get best(): number | undefined {
    return this.bestSeconds;
  }
  get running(): boolean {
    return this.startedAt !== undefined;
  }

  start(nowSeconds: number): void {
    this.startedAt = nowSeconds;
    this.currentSeconds = 0;
  }
  update(nowSeconds: number): void {
    if (this.startedAt !== undefined)
      this.currentSeconds = Math.max(0, nowSeconds - this.startedAt);
  }
  finish(nowSeconds: number): number | undefined {
    if (this.startedAt === undefined) return undefined;
    this.update(nowSeconds);
    this.startedAt = undefined;
    if (
      this.bestSeconds === undefined ||
      this.currentSeconds < this.bestSeconds
    ) {
      this.bestSeconds = this.currentSeconds;
      const saved: StoredTimes = {
        version: 1,
        bestSeconds: this.currentSeconds,
      };
      this.storage.setItem(BEST_LAP_STORAGE_KEY, JSON.stringify(saved));
    }
    return this.currentSeconds;
  }
  reset(): void {
    this.startedAt = undefined;
    this.currentSeconds = 0;
  }
}
