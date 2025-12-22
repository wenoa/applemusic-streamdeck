import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { StreamDeckDisplay } from "../../../src/display/stream-deck-display";
import { EnglishCaptions } from "../../../src/images/captions";
import { KeyImages } from "../../../src/images/key-images";
import { NowPlayingKey } from "../../../src/keys/now-playing-key";
import { AppleMusic } from "../../../src/music/apple-music";
import { ProcessMusicBridge } from "../../../src/music/bridge/process-music-bridge";
import { CatalogCovers } from "../../../src/music/catalog/catalog-covers";
import { UserPlaylist } from "../../../src/music/playlists/playlist";
import { UnauthorizedMusic } from "../../../src/music/situations/situation";
import { ManualTimer } from "../../core/manual-timer";
import { FakeCatalog } from "../fake-catalog";
import { FakeKey } from "../../stream-deck/fake-key";
import { RecordingLogger } from "./recording-logger";

const fakeBridge = fileURLToPath(new URL("fake-bridge-executable.mjs", import.meta.url));
const images = new KeyImages(new EnglishCaptions());

class Moments {
  static async until(condition: () => boolean) {
    const deadline = Date.now() + 3000;

    while (!condition() && Date.now() < deadline) {
      await Moments.passing(10);
    }
  }

  static async passing(milliseconds: number) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}

class SituationCounter {
  private changes = 0;

  constructor(music: AppleMusic) {
    music.whenSituationChanges(async () => {
      this.changes += 1;
    });
  }

  async until(changes: number) {
    await Moments.until(() => this.changes === changes);

    return this.changes;
  }
}

describe("ProcessMusicBridge", () => {
  let bridges: ProcessMusicBridge[] = [];

  const bridgeWith = (logger: RecordingLogger, restart: ManualTimer) => {
    const bridge = new ProcessMusicBridge(process.execPath, [fakeBridge], logger, restart);
    bridges = [...bridges, bridge];

    return bridge;
  };

  const aBridge = () => bridgeWith(new RecordingLogger(), new ManualTimer());

  afterEach(() => {
    bridges.forEach(bridge => bridge.send({ command: "quit" }));
    bridges = [];
  });

  it("tells Music what the bridge reports, even when a report arrives in pieces", async () => {
    const music = AppleMusic.connectedThrough(aBridge(), new ManualTimer());
    const key = FakeKey.withoutSettings();
    await music.changeSituationTo(new UnauthorizedMusic());

    await new SituationCounter(music).until(1);
    await music.render(new NowPlayingKey(new StreamDeckDisplay(key), images, new CatalogCovers(new FakeCatalog(), ["us"])));

    expect(key.lastImage()).toBe(images.closedMusic().dataUri());
  });

  it("sends commands to the bridge", async () => {
    const music = AppleMusic.connectedThrough(aBridge(), new ManualTimer());

    const playlists = await music.listPlaylists();

    expect(playlists).toEqual([new UserPlaylist("26C1DEB09689BE33", "Work")]);
  });

  it("tells Music about the changes caused by its commands", async () => {
    const music = AppleMusic.connectedThrough(aBridge(), new ManualTimer());
    const situations = new SituationCounter(music);

    music.togglePlayback();

    expect(await situations.until(2)).toBe(2);
  });

  it("logs what the bridge complains about", async () => {
    const logger = new RecordingLogger();
    const bridge = bridgeWith(logger, new ManualTimer());
    AppleMusic.connectedThrough(bridge, new ManualTimer());

    bridge.send({ command: "complain" });
    await Moments.until(() => logger.hasLogged("something went wrong"));

    expect(logger.hasLogged("Music bridge: something went wrong")).toBe(true);
  });

  it("logs and ignores what the bridge reports that isn't an event", async () => {
    const logger = new RecordingLogger();
    const bridge = bridgeWith(logger, new ManualTimer());
    AppleMusic.connectedThrough(bridge, new ManualTimer());

    bridge.send({ command: "mumble" });
    await Moments.until(() => logger.hasLogged("Ignored a malformed Music bridge event:"));

    expect(logger.hasLogged("Ignored a malformed Music bridge event:")).toBe(true);
  });

  it("logs the failures of whoever listens to Music", async () => {
    const logger = new RecordingLogger();
    const music = AppleMusic.connectedThrough(bridgeWith(logger, new ManualTimer()), new ManualTimer());

    music.whenSituationChanges(async () => {
      throw new Error("could not render");
    });
    await Moments.until(() => logger.hasLogged("Could not handle a Music bridge event:"));

    expect(logger.hasLogged("Could not handle a Music bridge event: Error: could not render")).toBe(true);
  });

  it("releases what Music waits from a bridge that exited", async () => {
    const logger = new RecordingLogger();
    const bridge = bridgeWith(logger, new ManualTimer());
    const music = AppleMusic.connectedThrough(bridge, new ManualTimer());
    await new SituationCounter(music).until(1);
    const description = music.describe(new UserPlaylist("26C1DEB09689BE33", "Work"));

    bridge.send({ command: "quit" });
    await description;

    expect(logger.hasLogged("Music bridge exited with code 3")).toBe(true);
  });

  it("starts the bridge again after it exits", async () => {
    const restart = new ManualTimer();
    const bridge = bridgeWith(new RecordingLogger(), restart);
    const music = AppleMusic.connectedThrough(bridge, new ManualTimer());
    const situations = new SituationCounter(music);
    await situations.until(1);
    bridge.send({ command: "quit" });
    await Moments.until(() => restart.isActive());

    await restart.elapse();

    expect(await situations.until(2)).toBe(2);
  });

  it("ignores commands sent before connecting", () => {
    const bridge = new ProcessMusicBridge(process.execPath, [fakeBridge], new RecordingLogger(), new ManualTimer());

    expect(() => bridge.send({ command: "togglePlayback" })).not.toThrow();
  });

  it("logs when the bridge can't be started", async () => {
    const logger = new RecordingLogger();
    AppleMusic.connectedThrough(new ProcessMusicBridge("/nonexistent/music-bridge", [], logger, new ManualTimer()), new ManualTimer());

    await Moments.until(() => logger.hasLogged("Music bridge failed:"));

    expect(logger.hasLogged("Music bridge failed:")).toBe(true);
  });

  it("logs when it can't write to the bridge", async () => {
    const logger = new RecordingLogger();
    const bridge = bridgeWith(logger, new ManualTimer());
    await new SituationCounter(AppleMusic.connectedThrough(bridge, new ManualTimer())).until(1);
    bridge.send({ command: "stopListening" });
    await Moments.passing(50);

    bridge.send({ command: "togglePlayback" });
    await Moments.until(() => logger.hasLogged("Could not write to the Music bridge:"));

    expect(logger.hasLogged("Could not write to the Music bridge:")).toBe(true);
  });
});
