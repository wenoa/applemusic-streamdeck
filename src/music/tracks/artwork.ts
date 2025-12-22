import { EncodedKeyImage } from "../../images/key-image";
import type { NowPlayingKey } from "../../keys/now-playing-key";
import type { TrackDescription } from "./track";
import { Album } from "./album";

export abstract class Artwork {
  static fromBridge({ artwork, artist, album }: TrackDescription): Artwork {
    if (typeof artwork === "string") {
      return new CoverArtwork(new EncodedKeyImage(artwork));
    }

    if (typeof artist === "string" && artist !== "" && typeof album === "string" && album !== "") {
      return new CatalogArtwork(new Album(artist, album));
    }

    return new MissingArtwork();
  }

  abstract renderOn(aKey: NowPlayingKey): Promise<void>;
}

export class CoverArtwork extends Artwork {
  constructor(private readonly image: EncodedKeyImage) {
    super();
  }

  async renderOn(aKey: NowPlayingKey) {
    await aKey.showArtwork(this.image);
  }
}

export class MissingArtwork extends Artwork {
  async renderOn(aKey: NowPlayingKey) {
    await aKey.showPause();
  }
}

// Music doesn't give the cover of some tracks that aren't in the library, so it's looked up in Apple's catalog.
export class CatalogArtwork extends Artwork {
  constructor(private readonly album: Album) {
    super();
  }

  async renderOn(aKey: NowPlayingKey) {
    await aKey.showCatalogCoverOf(this.album);
  }
}
