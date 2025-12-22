import { beforeEach, describe, expect, it } from "vitest";
import { FavoriteAction } from "../../src/actions/favorite";
import { AppleMusic } from "../../src/music/apple-music";
import { ManualTimer } from "../core/manual-timer";
import { FakeMusicBridge } from "../music/fake-music-bridge";
import { FakeKey } from "../stream-deck/fake-key";
import { images } from "./music-actions";

describe("FavoriteAction", () => {
  it("shows that the playing track is a favorite", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await FavoriteAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images).onWillAppear(key.appeared());

    await bridge.report({
      type: "playing",
      track: { favorited: true },
    });

    expect(key.lastImage()).toBe(images.favorite().dataUri());
  });

  it("shows that the paused track is not a favorite", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await FavoriteAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images).onWillAppear(key.appeared());

    await bridge.report({ type: "paused" });

    expect(key.lastImage()).toBe(images.notFavorite().dataUri());
  });

  it("shows that there is no track to favorite when nothing is playing", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await FavoriteAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images).onWillAppear(key.appeared());

    await bridge.report({ type: "stopped" });

    expect(key.lastImage()).toBe(images.favoriteWithoutTrack().dataUri());
  });

  it.each(["playing", "paused"])("toggles the favorite of the %s track when pressed", async type => {
    const bridge = new FakeMusicBridge();
    const action = FavoriteAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images);
    await bridge.report({ type });

    await action.onKeyDown(FakeKey.withoutSettings().pressed());

    expect(bridge.lastCommand()).toEqual({ command: "toggleFavorite" });
  });

  describe("when pressed while a track that is not a favorite has been playing for a while", () => {
    let bridge: FakeMusicBridge;
    let situationFollowUp: ManualTimer;
    let key: FakeKey;

    beforeEach(async () => {
      bridge = new FakeMusicBridge();
      situationFollowUp = new ManualTimer();
      key = FakeKey.withoutSettings();
      const action = FavoriteAction.connectedTo(AppleMusic.connectedThrough(bridge, situationFollowUp), images);
      await action.onWillAppear(key.appeared());
      await bridge.report({
        type: "playing",
        track: { favorited: false },
      });
      // Music has long stopped being checked after the track started.
      await situationFollowUp.elapseRepeatedly(10);

      await action.onKeyDown(key.pressed());
    });

    it("shows the favorite once Music applies it, even when it takes a while", async () => {
      bridge.musicChangesWithoutNotice({
        type: "playing",
        track: { favorited: true },
      });
      await situationFollowUp.elapse();
      await bridge.settle();

      expect(key.lastImage()).toBe(images.favorite().dataUri());
    });

    it("shows the favorite that Music applies by the tenth check", async () => {
      await situationFollowUp.elapseRepeatedly(9);
      bridge.musicChangesWithoutNotice({
        type: "playing",
        track: { favorited: true },
      });
      await situationFollowUp.elapse();
      await bridge.settle();

      expect(key.lastImage()).toBe(images.favorite().dataUri());
    });

    it("stops checking Music after the tenth check", async () => {
      await situationFollowUp.elapseRepeatedly(10);
      bridge.musicChangesWithoutNotice({
        type: "playing",
        track: { favorited: true },
      });
      await situationFollowUp.elapse();
      await bridge.settle();

      expect(key.lastImage()).toBe(images.notFavorite().dataUri());
    });
  });

  it("shows the favorite that Music loads after the track starts", async () => {
    const bridge = new FakeMusicBridge();
    const situationFollowUp = new ManualTimer();
    const key = FakeKey.withoutSettings();
    await FavoriteAction.connectedTo(AppleMusic.connectedThrough(bridge, situationFollowUp), images).onWillAppear(key.appeared());
    await bridge.report({
      type: "playing",
      track: { favorited: false },
    });

    bridge.musicChangesWithoutNotice({
      type: "playing",
      track: { favorited: true },
    });
    await situationFollowUp.elapse();
    await bridge.settle();

    expect(key.lastImage()).toBe(images.favorite().dataUri());
  });

  it("shows an alert when pressed while nothing is playing", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    const action = FavoriteAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images);
    await bridge.report({ type: "stopped" });

    await action.onKeyDown(key.pressed());

    expect([key.alertsShown(), bridge.commandsSent()]).toEqual([1, []]);
  });
});
