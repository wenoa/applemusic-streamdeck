export interface Timer {
  start(aCallback: () => Promise<void>): void;

  stop(): void;

  isActive(): boolean;
}
