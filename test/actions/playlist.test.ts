import { describe, expect, it } from "vitest";
import { PlaylistAction } from "../../src/actions/playlist";
import { AppleMusic } from "../../src/music/apple-music";
import { ManualTimer } from "../core/manual-timer";
import { FakeMusicBridge } from "../music/fake-music-bridge";
import { FakeKey } from "../stream-deck/fake-key";
import { FakePropertyInspector } from "./fake-property-inspector";
import { images } from "./music-actions";

const work = {
  playlist: "26C1DEB09689BE33",
  playlistName: "Work",
};
const mosaic = "data:image/png;base64,bW9zYWlj";

describe("PlaylistAction", () => {
  it("asks Music to describe its playlist and shows the playlist name meanwhile", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());

    await bridge.report({ type: "stopped" });

    expect([bridge.lastCommand(), key.lastImage()]).toEqual([
      {
        command: "describePlaylist",
        playlist: work.playlist,
      },
      images.playlistNamed("Work").dataUri(),
    ]);
  });

  it("shows the cover Music describes for its playlist", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });

    await bridge.report({
      type: "playlist",
      playlist: {
        id: work.playlist,
        name: "Work",
        artwork: mosaic,
      },
    });

    expect(key.lastImage()).toBe(mosaic);
  });

  it("shows the current name of a playlist without cover", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });

    await bridge.report({
      type: "playlist",
      playlist: {
        id: work.playlist,
        name: "Office",
      },
    });

    expect(key.lastImage()).toBe(images.playlistNamed("Office").dataUri());
  });

  it("keeps showing the chosen name of a playlist Music no longer has", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    const action = PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector());
    await action.onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });
    await bridge.report({
      type: "playlist",
      playlist: { id: work.playlist },
    });

    await bridge.report({ type: "playing" });

    expect([key.lastImage(), bridge.commandsSent().length]).toEqual([images.playlistNamed("Work").dataUri(), 1]);
  });

  it("ignores descriptions of other playlists", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });

    await bridge.report({
      type: "playlist",
      playlist: {
        id: "D5988F1B0C26D8E7",
        artwork: mosaic,
      },
    });

    expect(key.lastImage()).toBe(images.playlistNamed("Work").dataUri());
  });

  it("ignores the description of the playlist it had before its settings changed", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    const action = PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector());
    await bridge.report({ type: "stopped" });
    await action.onWillAppear(key.appeared());
    await action.onDidReceiveSettings(key.changedSettingsTo({
      playlist: "D5988F1B0C26D8E7",
      playlistName: "Gym",
    }));

    await bridge.report({
      type: "playlist",
      playlist: {
        id: work.playlist,
        name: "Work",
        artwork: mosaic,
      },
    });

    expect(key.lastImage()).toBe(images.playlistNamed("Gym").dataUri());
  });

  it("ignores descriptions without a playlist", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });

    await bridge.report({ type: "playlist" });

    expect(key.lastImage()).toBe(images.playlistNamed("Work").dataUri());
  });

  it("asks again for the cover Music couldn't describe the next time Music changes", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });
    await bridge.report({
      type: "playlistUnavailable",
      id: work.playlist,
    });

    await bridge.report({ type: "playing" });

    expect(bridge.commandsSent().length).toBe(2);
  });

  it("asks again for the cover the bridge couldn't answer before disconnecting", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });
    bridge.disconnect();
    await bridge.settle();

    await bridge.report({ type: "playing" });

    expect(bridge.commandsSent().length).toBe(2);
  });

  it("doesn't ask for the cover while it waits for it", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith(work);
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());
    await bridge.report({ type: "stopped" });

    await bridge.report({ type: "playing" });

    expect(bridge.commandsSent().length).toBe(1);
  });

  it("plays its playlist when pressed", async () => {
    const bridge = new FakeMusicBridge();
    const action = PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector());
    await bridge.report({ type: "stopped" });

    await action.onKeyDown(FakeKey.configuredWith(work).pressed());

    expect(bridge.lastCommand()).toEqual({
      command: "playPlaylist",
      playlist: work.playlist,
    });
  });

  it("shows that no playlist was chosen", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());

    await bridge.report({ type: "stopped" });

    expect(key.lastImage()).toBe(images.missingPlaylist().dataUri());
  });

  it("shows an alert when pressed without a chosen playlist", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    const action = PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector());
    await bridge.report({ type: "stopped" });

    await action.onKeyDown(key.pressed());

    expect([key.alertsShown(), bridge.commandsSent()]).toEqual([1, []]);
  });

  it("shows an empty name while it waits for the cover of a playlist chosen without its name", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.configuredWith({ playlist: work.playlist });
    await PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new FakePropertyInspector()).onWillAppear(key.appeared());

    await bridge.report({ type: "stopped" });

    expect(key.lastImage()).toBe(images.playlistNamed("").dataUri());
  });

  it("offers the playlists of Music to the property inspector", async () => {
    const bridge = new FakeMusicBridge();
    const propertyInspector = new FakePropertyInspector();
    const action = PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, propertyInspector);
    const offering = action.onSendToPlugin({ payload: { event: "getPlaylists" } } as never);

    await bridge.report({
      type: "playlists",
      playlists: [
        {
          id: work.playlist,
          name: "Work",
        },
        { id: "incomplete" },
      ],
    });
    await offering;

    expect([bridge.lastCommand(), propertyInspector.lastPayload()]).toEqual([
      { command: "listPlaylists" },
      {
        event: "getPlaylists",
        items: [
          {
            label: "Work",
            value: work.playlist,
          },
        ],
      },
    ]);
  });

  it("offers no playlists when the bridge disconnects before listing them", async () => {
    const bridge = new FakeMusicBridge();
    const propertyInspector = new FakePropertyInspector();
    const action = PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, propertyInspector);
    const offering = action.onSendToPlugin({ payload: {} } as never);

    bridge.disconnect();
    await offering;

    expect(propertyInspector.lastPayload()).toEqual({
      event: "",
      items: [],
    });
  });

  it("offers no playlists when Music doesn't describe them", async () => {
    const bridge = new FakeMusicBridge();
    const propertyInspector = new FakePropertyInspector();
    const action = PlaylistAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, propertyInspector);
    const offering = action.onSendToPlugin({ payload: { event: "getPlaylists" } } as never);

    await bridge.report({ type: "playlists" });
    await offering;

    expect(propertyInspector.lastPayload()).toEqual({
      event: "getPlaylists",
      items: [],
    });
  });
});
