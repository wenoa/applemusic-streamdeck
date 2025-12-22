import { describe, expect, it } from "vitest";
import { NowPlayingAction } from "../../src/actions/now-playing";
import { AppleMusic } from "../../src/music/apple-music";
import { CatalogCovers } from "../../src/music/catalog/catalog-covers";
import { ManualTimer } from "../core/manual-timer";
import { FakeCatalog } from "../music/fake-catalog";
import { FakeMusicBridge } from "../music/fake-music-bridge";
import { FakeKey } from "../stream-deck/fake-key";
import { images } from "./music-actions";

const cover = "data:image/png;base64,Y292ZXI=";

describe("NowPlayingAction", () => {
  it("shows the cover of the playing track", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(new FakeCatalog(), ["us"])).onWillAppear(key.appeared());

    await bridge.report({
      type: "playing",
      track: {
        favorited: false,
        artwork: cover,
      },
    });

    expect(key.lastImage()).toBe(cover);
  });

  it("shows pause when the playing track has no cover", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(new FakeCatalog(), ["us"])).onWillAppear(key.appeared());

    await bridge.report({
      type: "playing",
      track: { favorited: false },
    });

    expect(key.lastImage()).toBe(images.pause().dataUri());
  });

  it("hides the cover while the track is paused", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(new FakeCatalog(), ["us"])).onWillAppear(key.appeared());

    await bridge.report({
      type: "paused",
      track: {
        favorited: false,
        artwork: cover,
      },
    });

    expect(key.lastImage()).toBe(images.play().dataUri());
  });

  it("shows play when nothing is playing", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(new FakeCatalog(), ["us"])).onWillAppear(key.appeared());

    await bridge.report({ type: "stopped" });

    expect(key.lastImage()).toBe(images.play().dataUri());
  });

  it("toggles playback when pressed", async () => {
    const bridge = new FakeMusicBridge();
    const action = NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(new FakeCatalog(), ["us"]));
    await bridge.report({ type: "stopped" });

    await action.onKeyDown(FakeKey.withoutSettings().pressed());

    expect(bridge.lastCommand()).toEqual({ command: "togglePlayback" });
  });

  describe("when Music gives no cover", () => {
    it("shows the cover of the album from Apple's catalog", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog().withSong("us", {
        artist: "Barrie",
        album: "Gloria - Single",
        artworkUrl: "data:image/jpeg;base64,Z2xvcmlh",
      });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(key.appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      });

      expect(key.lastImage()).toBe("data:image/jpeg;base64,Z2xvcmlh");
    });

    it("looks for the album in the next storefront when the first one doesn't have it", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog().withSong("us", {
        artist: "This Is the Kit",
        album: "Ghost Coat",
        artworkUrl: "data:image/jpeg;base64,Z2hvc3Q=",
      });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["ar", "us"])).onWillAppear(key.appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "This Is the Kit",
          album: "Ghost Coat",
        },
      });

      expect(key.lastImage()).toBe("data:image/jpeg;base64,Z2hvc3Q=");
    });

    it("looks for the album first in the catalog of the Mac's country", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog()
        .withSong("ar", {
          artist: "Barrie",
          album: "Gloria - Single",
          artworkUrl: "data:image/jpeg;base64,YXI=",
        })
        .withSong("us", {
          artist: "Barrie",
          album: "Gloria - Single",
          artworkUrl: "data:image/jpeg;base64,dXM=",
        });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, CatalogCovers.forMacLocale(catalog, "es_AR")).onWillAppear(key.appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      });

      expect(key.lastImage()).toBe("data:image/jpeg;base64,YXI=");
    });

    it("looks for the album in the US catalog when the one of the Mac's country doesn't have it", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog().withSong("us", {
        artist: "This Is the Kit",
        album: "Ghost Coat",
        artworkUrl: "data:image/jpeg;base64,Z2hvc3Q=",
      });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, CatalogCovers.forMacLocale(catalog, "es_AR")).onWillAppear(key.appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "This Is the Kit",
          album: "Ghost Coat",
        },
      });

      expect(key.lastImage()).toBe("data:image/jpeg;base64,Z2hvc3Q=");
    });

    it("looks for the album only in the US catalog when the Mac's region has no country", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog().withSong("us", {
        artist: "Barrie",
        album: "Gloria - Single",
        artworkUrl: "data:image/jpeg;base64,Z2xvcmlh",
      });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, CatalogCovers.forMacLocale(catalog, "es")).onWillAppear(key.appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      });

      expect([key.lastImage(), catalog.searchesMade()]).toEqual(["data:image/jpeg;base64,Z2xvcmlh", 1]);
    });

    it("looks up each album only once", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog().withSong("us", {
        artist: "Barrie",
        album: "Gloria - Single",
        artworkUrl: "data:image/jpeg;base64,Z2xvcmlh",
      });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(key.appeared());
      const playing = {
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      };
      await bridge.report(playing);

      await bridge.report({
        ...playing,
        track: {
          ...playing.track,
          favorited: true,
        },
      });

      expect(catalog.searchesMade()).toBe(1);
    });

    it("looks up the album once for all the keys showing it", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog().withSong("us", {
        artist: "Barrie",
        album: "Gloria - Single",
        artworkUrl: "data:image/jpeg;base64,Z2xvcmlh",
      });
      const action = NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"]));
      await action.onWillAppear(FakeKey.identifiedAs("stream-deck-xl", {}).appeared());
      await action.onWillAppear(FakeKey.identifiedAs("stream-deck-mobile", {}).appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      });

      expect(catalog.searchesMade()).toBe(1);
    });

    it("downloads one cover even when several songs of the album are found", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog()
        .withSong("us", {
          artist: "feel trip.",
          album: "feel trip.",
          artworkUrl: "data:image/jpeg;base64,ZmVlbA==",
        })
        .withSong("us", {
          artist: "feel trip.",
          album: "feel trip.",
          artworkUrl: "data:image/jpeg;base64,ZmVlbA==",
        });
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(FakeKey.withoutSettings().appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "feel trip.",
          album: "feel trip.",
        },
      });

      expect(catalog.imagesDownloaded()).toBe(1);
    });

    it("shows the cover of the next album of the artist", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog()
        .withSong("us", {
          artist: "Barrie",
          album: "Gloria - Single",
          artworkUrl: "data:image/jpeg;base64,Z2xvcmlh",
        })
        .withSong("us", {
          artist: "Barrie",
          album: "Barbara",
          artworkUrl: "data:image/jpeg;base64,YmFyYmFyYQ==",
        });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(key.appeared());
      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      });

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Barbara",
        },
      });

      expect(key.lastImage()).toBe("data:image/jpeg;base64,YmFyYmFyYQ==");
    });

    it("shows the cover of the next album with the same title by another artist", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog()
        .withSong("us", {
          artist: "Barrie",
          album: "Gloria - Single",
          artworkUrl: "data:image/jpeg;base64,Z2xvcmlh",
        })
        .withSong("us", {
          artist: "Laura Branigan",
          album: "Gloria - Single",
          artworkUrl: "data:image/jpeg;base64,bGF1cmE=",
        });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(key.appeared());
      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      });

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Laura Branigan",
          album: "Gloria - Single",
        },
      });

      expect(key.lastImage()).toBe("data:image/jpeg;base64,bGF1cmE=");
    });

    it("looks up the album again when the catalog couldn't be reached", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog()
        .withSong("us", {
          artist: "Barrie",
          album: "Gloria - Single",
          artworkUrl: "data:image/jpeg;base64,Z2xvcmlh",
        })
        .becomesUnreachable();
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(key.appeared());
      const playing = {
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      };
      await bridge.report(playing);

      catalog.becomesReachable();
      await bridge.report({
        ...playing,
        track: {
          ...playing.track,
          favorited: true,
        },
      });

      expect(key.lastImage()).toBe("data:image/jpeg;base64,Z2xvcmlh");
    });

    it("doesn't look up a track without album", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(FakeKey.withoutSettings().appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Radio Nacional",
          album: "",
        },
      });

      expect(catalog.searchesMade()).toBe(0);
    });

    it("doesn't look up a track without artist", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(FakeKey.withoutSettings().appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "",
          album: "Grabaciones caseras",
        },
      });

      expect(catalog.searchesMade()).toBe(0);
    });

    it("ignores the covers of other albums of the artist", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog().withSong("us", {
        artist: "Barrie",
        album: "Barbara",
        artworkUrl: "data:image/jpeg;base64,YmFyYmFyYQ==",
      });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(key.appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      });

      expect(key.lastImage()).toBe(images.pause().dataUri());
    });

    it("ignores the covers of albums with the same title by other artists", async () => {
      const bridge = new FakeMusicBridge();
      const catalog = new FakeCatalog().withSong("us", {
        artist: "Laura Branigan",
        album: "Gloria - Single",
        artworkUrl: "data:image/jpeg;base64,bGF1cmE=",
      });
      const key = FakeKey.withoutSettings();
      await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(catalog, ["us"])).onWillAppear(key.appeared());

      await bridge.report({
        type: "playing",
        track: {
          favorited: false,
          artist: "Barrie",
          album: "Gloria - Single",
        },
      });

      expect(key.lastImage()).toBe(images.pause().dataUri());
    });
  });

  it("doesn't send the cover again when it didn't change", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await NowPlayingAction.connectedTo(AppleMusic.connectedThrough(bridge, new ManualTimer()), images, new CatalogCovers(new FakeCatalog(), ["us"])).onWillAppear(key.appeared());
    const playing = {
      type: "playing",
      track: {
        favorited: false,
        artwork: cover,
      },
    };
    await bridge.report(playing);

    await bridge.report({
      ...playing,
      track: {
        ...playing.track,
        favorited: true,
      },
    });

    expect(key.imagesShown()).toBe(2);
  });
});
