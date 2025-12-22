import type { Timer } from "../../src/core/timer";

export class ManualTimer implements Timer {
  private pendingCallbacks: (() => Promise<void>)[] = [];

  start(callback: () => Promise<void>) {
    this.pendingCallbacks = [callback];
  }

  stop() {
    this.pendingCallbacks = [];
  }

  isActive() {
    return this.pendingCallbacks.length > 0;
  }

  async elapse() {
    const callbacks = this.pendingCallbacks;
    this.pendingCallbacks = [];
    await Promise.all(callbacks.map(callback => callback()));
  }

  async elapseRepeatedly(times: number) {
    await Array.from({ length: times }).reduce<Promise<void>>(async previousElapse => {
      await previousElapse;
      await this.elapse();
    }, Promise.resolve());
  }
}
