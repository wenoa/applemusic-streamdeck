import type { Timer } from "../core/timer";

const CHECKS_AFTER_A_CHANGE = 10;

// Music applies some changes (a favorite, what it loads after a track starts) a few seconds later and doesn't notify
// them, so after every change its situation is checked again for a while.
export class SituationFollowUp {
  private remainingChecks = 0;

  constructor(private readonly timer: Timer) {
  }

  restart(aCheck: () => void) {
    this.remainingChecks = CHECKS_AFTER_A_CHANGE;
    this.scheduleNext(aCheck);
  }

  private scheduleNext(aCheck: () => void) {
    this.timer.start(async () => {
      aCheck();
      this.remainingChecks -= 1;
      if (this.remainingChecks > 0) {
        this.scheduleNext(aCheck);
      }
    });
  }
}
