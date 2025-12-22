import type { Listeners } from "../../core/listeners";
import type { Display } from "../../display/display";
import type { KeyImages } from "../../images/key-images";
import { ConfiguredPlaylistKey, UnconfiguredPlaylistKey } from "../../keys/playlist-key";
import type { MusicKey } from "../../keys/music-key";
import type { BridgeCommand } from "../bridge/music-bridge";

export type PlaylistSettings = {
  playlist?: string;
  playlistName?: string;
};

type PlaylistDescription = {
  id?: unknown;
  name?: unknown;
};

export abstract class Playlist {
  static fromSettings({ playlist = "", playlistName = "" }: PlaylistSettings): Playlist {
    return playlist === "" ? new NoPlaylist() : new UserPlaylist(playlist, playlistName);
  }

  abstract keyOn(aDisplay: Display, someImages: KeyImages, someCoverArrivals: Listeners): MusicKey;
}

export class UserPlaylist extends Playlist {
  constructor(
    private readonly identifier: string,
    private readonly name: string,
  ) {
    super();
  }

  static allFromBridge(someDescriptions: unknown) {
    const playlistDescriptions: PlaylistDescription[] = Array.isArray(someDescriptions) ? someDescriptions : [];

    return playlistDescriptions
      .filter(description => typeof description.id === "string" && typeof description.name === "string")
      .map(description => new UserPlaylist(String(description.id), String(description.name)));
  }

  keyOn(aDisplay: Display, someImages: KeyImages, someCoverArrivals: Listeners) {
    return new ConfiguredPlaylistKey(aDisplay, someImages, this, someCoverArrivals);
  }

  isIdentifiedBy(anIdentifier: unknown) {
    return this.identifier === anIdentifier;
  }

  async renderNameOn(aKey: ConfiguredPlaylistKey) {
    await aKey.showName(this.name);
  }

  playbackCommand(): BridgeCommand {
    return {
      command: "playPlaylist",
      playlist: this.identifier,
    };
  }

  descriptionCommand(): BridgeCommand {
    return {
      command: "describePlaylist",
      playlist: this.identifier,
    };
  }

  asSelectableItem() {
    return {
      label: this.name,
      value: this.identifier,
    };
  }
}

export class NoPlaylist extends Playlist {
  keyOn(aDisplay: Display, someImages: KeyImages) {
    return new UnconfiguredPlaylistKey(aDisplay, someImages);
  }
}
