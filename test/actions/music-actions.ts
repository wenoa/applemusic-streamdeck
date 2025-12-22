import type { AppleMusicAction } from "../../src/actions/apple-music-action";
import { FavoriteAction } from "../../src/actions/favorite";
import { NextTrackAction } from "../../src/actions/next-track";
import { NowPlayingAction } from "../../src/actions/now-playing";
import { PlaylistAction } from "../../src/actions/playlist";
import { PreviousTrackAction } from "../../src/actions/previous-track";
import { VolumeAction } from "../../src/actions/volume";
import { EnglishCaptions } from "../../src/images/captions";
import { KeyImages } from "../../src/images/key-images";
import type { AppleMusic } from "../../src/music/apple-music";
import { CatalogCovers } from "../../src/music/catalog/catalog-covers";
import { FakeCatalog } from "../music/fake-catalog";
import { FakePropertyInspector } from "./fake-property-inspector";

export const images = new KeyImages(new EnglishCaptions());

type MusicActionExample = {
  name: string;
  actionFor: (music: AppleMusic) => AppleMusicAction<any>;
  settings: Record<string, string>;
};

export const musicActions: MusicActionExample[] = [
  {
    name: "NowPlayingAction",
    actionFor: music => NowPlayingAction.connectedTo(music, images, new CatalogCovers(new FakeCatalog(), ["us"])),
    settings: {},
  },
  {
    name: "FavoriteAction",
    actionFor: music => FavoriteAction.connectedTo(music, images),
    settings: {},
  },
  {
    name: "PreviousTrackAction",
    actionFor: music => PreviousTrackAction.connectedTo(music, images),
    settings: {},
  },
  {
    name: "NextTrackAction",
    actionFor: music => NextTrackAction.connectedTo(music, images),
    settings: {},
  },
  {
    name: "VolumeAction",
    actionFor: music => VolumeAction.connectedTo(music, images),
    settings: { volumeChange: "25" },
  },
  {
    name: "PlaylistAction",
    actionFor: music => PlaylistAction.connectedTo(music, images, new FakePropertyInspector()),
    settings: {
      playlist: "26C1DEB09689BE33",
      playlistName: "Work",
    },
  },
];
