import { EncodedKeyImage } from "../../images/key-image";
import type { ConfiguredPlaylistKey } from "../../keys/playlist-key";
import type { AppleMusic } from "../apple-music";

export type PlaylistCoverDescription = {
  name?: unknown;
  artwork?: unknown;
};

export interface PlaylistCover {
  renderOn(aKey: ConfiguredPlaylistKey, anAppleMusic: AppleMusic): Promise<void>;
}

export interface PlaylistDescriptionAnswer {
  receivedBy(aKey: ConfiguredPlaylistKey): Promise<void>;
}

export class UnrequestedPlaylistCover implements PlaylistCover {
  async renderOn(aKey: ConfiguredPlaylistKey, anAppleMusic: AppleMusic) {
    await aKey.requestCover(anAppleMusic);
  }
}

export class RequestedPlaylistCover implements PlaylistCover {
  async renderOn(aKey: ConfiguredPlaylistKey) {
    await aKey.showOwnName();
  }
}

export abstract class ReceivedPlaylistCover implements PlaylistCover, PlaylistDescriptionAnswer {
  static fromBridge({ name, artwork }: PlaylistCoverDescription): ReceivedPlaylistCover {
    if (typeof artwork === "string") {
      return new ArtworkPlaylistCover(new EncodedKeyImage(artwork));
    }

    return typeof name === "string" ? new NamedPlaylistCover(name) : new MissingPlaylistCover();
  }

  abstract renderOn(aKey: ConfiguredPlaylistKey, anAppleMusic: AppleMusic): Promise<void>;

  async receivedBy(aKey: ConfiguredPlaylistKey) {
    await aKey.adopt(this);
  }
}

export class ArtworkPlaylistCover extends ReceivedPlaylistCover {
  constructor(private readonly artwork: EncodedKeyImage) {
    super();
  }

  async renderOn(aKey: ConfiguredPlaylistKey) {
    await aKey.showArtwork(this.artwork);
  }
}

export class NamedPlaylistCover extends ReceivedPlaylistCover {
  constructor(private readonly name: string) {
    super();
  }

  async renderOn(aKey: ConfiguredPlaylistKey) {
    await aKey.showName(this.name);
  }
}

export class MissingPlaylistCover extends ReceivedPlaylistCover {
  async renderOn(aKey: ConfiguredPlaylistKey) {
    await aKey.showOwnName();
  }
}

// Music could not describe the playlist now; it is asked again the next time the key is rendered.
export class UnavailablePlaylistDescription implements PlaylistDescriptionAnswer {
  async receivedBy(aKey: ConfiguredPlaylistKey) {
    aKey.forgetCover();
  }
}
