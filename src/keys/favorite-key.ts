import type { AppleMusic } from "../music/apple-music";
import type { Player } from "../music/players/player";
import { MusicKey } from "./music-key";

export class FavoriteKey extends MusicKey {
  async renderFor(aPlayer: Player) {
    await aPlayer.renderFavoriteOn(this);
  }

  async pressFor(aPlayer: Player, anAppleMusic: AppleMusic) {
    await aPlayer.toggleFavoriteFrom(this, anAppleMusic);
  }

  async showFavorite() {
    await this.display.show(this.images.favorite());
  }

  async showNotFavorite() {
    await this.display.show(this.images.notFavorite());
  }

  async showWithoutTrack() {
    await this.display.show(this.images.favoriteWithoutTrack());
  }
}
