import { describe, expect, it } from "vitest";
import { VolumeAction } from "../../src/actions/volume";
import { AppleMusic } from "../../src/music/apple-music";
import { ManualTimer } from "../core/manual-timer";
import { FakeMusicBridge } from "../music/fake-music-bridge";
import { FakeKey } from "../stream-deck/fake-key";
import { images } from "./music-actions";

describe("VolumeAction", () => {
  it.each([
    ["25", "+25%"],
    ["-25", "-25%"],
    [" 100 ", "+100%"],
    ["-100", "-100%"],
  ])("shows a change of %s as %s", async (volumeChange, caption) => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith({ volumeChange });
    await VolumeAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images).onWillAppear(key.appeared());

    await bridge.report({ type: "stopped" });

    expect(key.lastImage()).toBe(images.volumeChange(caption).dataUri());
  });

  it.each(["-25", "40"])("changes the volume of Music by %s percentage points when pressed", async volumeChange => {
    const bridge = new FakeMusicBridge();
    const action = VolumeAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images);
    await bridge.report({ type: "playing" });

    await action.onKeyDown(FakeKey.configuredWith({ volumeChange }).pressed());

    expect(bridge.lastCommand()).toEqual({
      command: "changeVolume",
      percentagePoints: Number(volumeChange),
    });
  });

  it.each(["", "0", "abc", "2.5", "101", "-150"])("shows that a change of '%s' can't be applied", async volumeChange => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith({ volumeChange });
    await VolumeAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images).onWillAppear(key.appeared());

    await bridge.report({ type: "stopped" });

    expect(key.lastImage()).toBe(images.invalidVolumeChange().dataUri());
  });

  it("shows that a missing change can't be applied", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await VolumeAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images).onWillAppear(key.appeared());

    await bridge.report({ type: "stopped" });

    expect(key.lastImage()).toBe(images.invalidVolumeChange().dataUri());
  });

  it("shows an alert instead of changing the volume when pressed with a change that can't be applied", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith({ volumeChange: "abc" });
    const action = VolumeAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images);
    await bridge.report({ type: "stopped" });

    await action.onKeyDown(key.pressed());

    expect([key.alertsShown(), bridge.commandsSent()]).toEqual([1, []]);
  });

  it("shows the new change when its settings change", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith({ volumeChange: "25" });
    const action = VolumeAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images);
    await action.onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });

    await action.onDidReceiveSettings(key.changedSettingsTo({ volumeChange: "-10" }));

    expect(key.lastImage()).toBe(images.volumeChange("-10%").dataUri());
  });
});
