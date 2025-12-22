import type { Display } from "../display/display";
import type { KeyImage } from "../images/key-image";
import type { KeyImages } from "../images/key-images";
import type { AppleMusic } from "../music/apple-music";
import type { CatalogCovers } from "../music/catalog/catalog-covers";
import type { Player } from "../music/players/player";
import type { Album } from "../music/tracks/album";
import { MusicKey } from "./music-key";

export class NowPlayingKey extends MusicKey {
  constructor(
    aDisplay: Display,
    someImages: KeyImages,
    private readonly catalogCovers: CatalogCovers,
  ) {
    super(aDisplay, someImages);
  }

  async renderFor(aPlayer: Player) {
    await aPlayer.renderNowPlayingOn(this);
  }

  async pressFor(_aPlayer: Player, anAppleMusic: AppleMusic) {
    anAppleMusic.togglePlayback();
  }

  async showPlay() {
    await this.display.show(this.images.play());
  }

  async showPause() {
    await this.display.show(this.images.pause());
  }

  async showArtwork(anArtwork: KeyImage) {
    await this.display.show(anArtwork);
  }

  async showCatalogCoverOf(anAlbum: Album) {
    await this.catalogCovers.renderOn(this, anAlbum);
  }
}
