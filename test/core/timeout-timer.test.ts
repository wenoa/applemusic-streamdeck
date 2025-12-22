import { describe, expect, it } from "vitest";
import { TimeoutTimer } from "../../src/core/timeout";

class Moments {
  static async passing(milliseconds: number) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}

describe("TimeoutTimer", () => {
  it("runs its callback once the duration passes", async () => {
    const timer = new TimeoutTimer(5);
    let runs = 0;

    timer.start(async () => {
      runs += 1;
    });
    await Moments.passing(30);

    expect(runs).toBe(1);
  });

  it("is active until it is stopped", () => {
    const timer = new TimeoutTimer(1000);
    timer.start(async () => {
    });
    const activeBeforeStopping = timer.isActive();

    timer.stop();

    expect([activeBeforeStopping, timer.isActive()]).toEqual([true, false]);
  });

  it("doesn't run the callback after it is stopped", async () => {
    const timer = new TimeoutTimer(5);
    let runs = 0;
    timer.start(async () => {
      runs += 1;
    });

    timer.stop();
    timer.stop();
    await Moments.passing(30);

    expect(runs).toBe(0);
  });

  it("runs only the last callback when started again before the duration passes", async () => {
    const timer = new TimeoutTimer(5);
    let runs: string[] = [];
    timer.start(async () => {
      runs = [...runs, "first"];
    });

    timer.start(async () => {
      runs = [...runs, "second"];
    });
    await Moments.passing(30);

    expect(runs).toEqual(["second"]);
  });
});
