import type { Timer } from "./timer";
import type { Timeout } from "./timeout/timeout";
import { InactiveTimeout } from "./timeout/timeout";

export class TimeoutTimer implements Timer {
  private timeout: Timeout = new InactiveTimeout();

  constructor(private duration: number) {
  }

  start(aCallback: () => Promise<void>) {
    this.timeout = this.timeout.start(aCallback, this.duration);
  }

  stop() {
    this.timeout = this.timeout.stop();
  }

  isActive() {
    return this.timeout.isActive();
  }
}
