import type { FavoriteKey } from "../../keys/favorite-key";
import type { NowPlayingKey } from "../../keys/now-playing-key";
import type { AppleMusic } from "../apple-music";
import type { Track } from "../tracks/track";
import type { Player } from "./player";

export abstract class PlayerWithTrack implements Player {
  constructor(protected readonly track: Track) {
  }

  abstract renderNowPlayingOn(aKey: NowPlayingKey): Promise<void>;

  async renderFavoriteOn(aKey: FavoriteKey) {
    await this.track.renderFavoriteOn(aKey);
  }

  async toggleFavoriteFrom(_aKey: FavoriteKey, anAppleMusic: AppleMusic) {
    anAppleMusic.toggleFavoriteOfCurrentTrack();
  }
}
