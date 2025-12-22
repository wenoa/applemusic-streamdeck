import type { FavoriteKey } from "../../keys/favorite-key";
import type { NowPlayingKey } from "../../keys/now-playing-key";
import type { Player } from "./player";

export class StoppedPlayer implements Player {
  async renderNowPlayingOn(aKey: NowPlayingKey) {
    await aKey.showPlay();
  }

  async renderFavoriteOn(aKey: FavoriteKey) {
    await aKey.showWithoutTrack();
  }

  async toggleFavoriteFrom(aKey: FavoriteKey) {
    await aKey.alert();
  }
}
