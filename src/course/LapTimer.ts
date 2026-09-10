interface StoredTimes {
  readonly version: 2;
  readonly bestSeconds: number;
}

export const bestLapStorageKey = (environment: string, track: string): string =>
  `sandfpv.best-lap.${encodeURIComponent(environment)}.${encodeURIComponent(track)}`;

export const BEST_LAP_STORAGE_KEY = bestLapStorageKey(
  "training-hall",
  "five-gates",
);

export class LapTimer {
  private startedAt?: number;
  private currentSeconds = 0;
  private bestSeconds?: number;
  private sessionBestSeconds?: number;
  private lastSeconds?: number;
  private storageKey = BEST_LAP_STORAGE_KEY;

  constructor(private readonly storage: Storage = localStorage) {
    this.loadAllTimeBest();
  }

  get elapsedSeconds(): number {
    return this.currentSeconds;
  }
  get best(): number | undefined {
    return this.bestSeconds;
  }
  get sessionBest(): number | undefined {
    return this.sessionBestSeconds;
  }
  get last(): number | undefined {
    return this.lastSeconds;
  }
  get running(): boolean {
    return this.startedAt !== undefined;
  }

  startSession(environment: string, track: string): void {
    this.storageKey = bestLapStorageKey(environment, track);
    this.sessionBestSeconds = undefined;
    this.reset();
    this.loadAllTimeBest();
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
    this.lastSeconds = this.currentSeconds;
    if (
      this.sessionBestSeconds === undefined ||
      this.currentSeconds < this.sessionBestSeconds
    )
      this.sessionBestSeconds = this.currentSeconds;
    if (
      this.bestSeconds === undefined ||
      this.currentSeconds < this.bestSeconds
    ) {
      this.bestSeconds = this.currentSeconds;
      const saved: StoredTimes = {
        version: 2,
        bestSeconds: this.currentSeconds,
      };
      this.storage.setItem(this.storageKey, JSON.stringify(saved));
    }
    return this.currentSeconds;
  }
  reset(): void {
    this.startedAt = undefined;
    this.currentSeconds = 0;
    this.lastSeconds = undefined;
  }
  clearAllTimeBest(): void {
    this.storage.removeItem(this.storageKey);
    this.bestSeconds = undefined;
  }

  private loadAllTimeBest(): void {
    this.bestSeconds = undefined;
    try {
      const saved = JSON.parse(
        this.storage.getItem(this.storageKey) ?? "null",
      ) as StoredTimes | null;
      if (
        saved?.version === 2 &&
        Number.isFinite(saved.bestSeconds) &&
        saved.bestSeconds > 0
      )
        this.bestSeconds = saved.bestSeconds;
    } catch {
      /* Invalid local data is ignored. */
    }
  }
}
