import type { FavoriteKey } from "../../keys/favorite-key";
import type { NowPlayingKey } from "../../keys/now-playing-key";
import type { AppleMusic } from "../apple-music";

export interface Player {
  renderNowPlayingOn(aKey: NowPlayingKey): Promise<void>;

  renderFavoriteOn(aKey: FavoriteKey): Promise<void>;

  toggleFavoriteFrom(aKey: FavoriteKey, anAppleMusic: AppleMusic): Promise<void>;
}
