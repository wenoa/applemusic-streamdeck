import type { FavoriteKey } from "../../keys/favorite-key";
import type { NowPlayingKey } from "../../keys/now-playing-key";
import { Artwork } from "./artwork";

export type TrackDescription = {
  favorited?: unknown;
  artwork?: unknown;
  artist?: unknown;
  album?: unknown;
};

export abstract class Track {
  constructor(private readonly artwork: Artwork) {
  }

  static fromBridge(aDescription: TrackDescription = {}): Track {
    const artwork = Artwork.fromBridge(aDescription);

    return aDescription.favorited === true ? new FavoritedTrack(artwork) : new UnfavoritedTrack(artwork);
  }

  async renderArtworkOn(aKey: NowPlayingKey) {
    await this.artwork.renderOn(aKey);
  }

  abstract renderFavoriteOn(aKey: FavoriteKey): Promise<void>;
}

export class FavoritedTrack extends Track {
  async renderFavoriteOn(aKey: FavoriteKey) {
    await aKey.showFavorite();
  }
}

export class UnfavoritedTrack extends Track {
  async renderFavoriteOn(aKey: FavoriteKey) {
    await aKey.showNotFavorite();
  }
}
