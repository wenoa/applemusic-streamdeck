import { describe, expect, it } from "vitest";
import { AppleMusicActions } from "../../src/actions/apple-music-actions";
import { AppleMusic } from "../../src/music/apple-music";
import { CatalogCovers } from "../../src/music/catalog/catalog-covers";
import { ManualTimer } from "../core/manual-timer";
import { FakeCatalog } from "../music/fake-catalog";
import { FakeMusicBridge } from "../music/fake-music-bridge";
import { FakeKey } from "../stream-deck/fake-key";
import { FakePropertyInspector } from "./fake-property-inspector";
import { images, musicActions } from "./music-actions";

describe.each(musicActions)("$name", ({ actionFor, settings }) => {
  it("says Music is closed until Music reports otherwise", async () => {
    const key = FakeKey.configuredWith(settings);
    const action = actionFor(AppleMusic.connectedThrough(new FakeMusicBridge(), new ManualTimer()));

    await action.onWillAppear(key.appeared());

    expect(key.lastImage()).toBe(images.closedMusic().dataUri());
  });

  it("opens Music when pressed while Music is closed", async () => {
    const bridge = new FakeMusicBridge();
    const action = actionFor(AppleMusic.connectedThrough(bridge, new ManualTimer()));

    await action.onKeyDown(FakeKey.configuredWith(settings).pressed());

    expect(bridge.lastCommand()).toEqual({ command: "open" });
  });

  it("says Music is closed when Music quits", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(settings);
    const action = actionFor(AppleMusic.connectedThrough(bridge, new ManualTimer()));
    await action.onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });

    await bridge.report({ type: "closed" });

    expect(key.lastImage()).toBe(images.closedMusic().dataUri());
  });

  it("says it has no permission to control Music", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(settings);
    const action = actionFor(AppleMusic.connectedThrough(bridge, new ManualTimer()));
    await action.onWillAppear(key.appeared());

    await bridge.report({ type: "unauthorized" });

    expect(key.lastImage()).toBe(images.unauthorizedMusic().dataUri());
  });

  it("reveals the Automation permission when pressed without permission to control Music", async () => {
    const bridge = new FakeMusicBridge();
    const action = actionFor(AppleMusic.connectedThrough(bridge, new ManualTimer()));
    await bridge.report({ type: "unauthorized" });

    await action.onKeyDown(FakeKey.configuredWith(settings).pressed());

    expect(bridge.lastCommand()).toEqual({ command: "revealAutomationPermission" });
  });

  it("stops updating keys that disappeared", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(settings);
    const action = actionFor(AppleMusic.connectedThrough(bridge, new ManualTimer()));
    await action.onWillAppear(key.appeared());
    await action.onWillDisappear(key.disappeared());

    await bridge.report({ type: "unauthorized" });

    expect(key.lastImage()).toBe(images.closedMusic().dataUri());
  });

  it("ignores what the bridge reports that it doesn't know", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(settings);
    const action = actionFor(AppleMusic.connectedThrough(bridge, new ManualTimer()));
    await action.onWillAppear(key.appeared());

    await bridge.report({ type: "rewinding" });

    expect([key.imagesShown(), key.lastImage()]).toEqual([1, images.closedMusic().dataUri()]);
  });

  it("updates every visible key", async () => {
    const bridge = new FakeMusicBridge();
    const firstKey = FakeKey.identifiedAs("first", settings);
    const secondKey = FakeKey.identifiedAs("second", settings);
    const action = actionFor(AppleMusic.connectedThrough(bridge, new ManualTimer()));
    await action.onWillAppear(firstKey.appeared());
    await action.onWillAppear(secondKey.appeared());

    await bridge.report({ type: "unauthorized" });

    expect([firstKey.lastImage(), secondKey.lastImage()]).toEqual([
      images.unauthorizedMusic().dataUri(),
      images.unauthorizedMusic().dataUri(),
    ]);
  });
});

describe("AppleMusicActions", () => {
  it("includes one action per kind of key", () => {
    const actions = new AppleMusicActions(AppleMusic.connectedThrough(new FakeMusicBridge(), new ManualTimer()), images, new FakePropertyInspector(), new CatalogCovers(new FakeCatalog(), ["us"]));
    const identifiers: string[] = [];

    actions.forEach(action => identifiers.push(action.manifestId ?? ""));

    expect(identifiers).toEqual([
      "studio.wenoa.applemusic.now-playing",
      "studio.wenoa.applemusic.favorite",
      "studio.wenoa.applemusic.previous-track",
      "studio.wenoa.applemusic.next-track",
      "studio.wenoa.applemusic.volume",
      "studio.wenoa.applemusic.playlist",
    ]);
  });
});
