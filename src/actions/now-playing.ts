import { action } from "@elgato/streamdeck";
import type { Display } from "../display/display";
import type { KeyImages } from "../images/key-images";
import { NowPlayingKey } from "../keys/now-playing-key";
import type { AppleMusic } from "../music/apple-music";
import type { CatalogCovers } from "../music/catalog/catalog-covers";
import { AppleMusicAction } from "./apple-music-action";

@action({ UUID: "studio.wenoa.applemusic.now-playing" })
export class NowPlayingAction extends AppleMusicAction {
  constructor(
    anAppleMusic: AppleMusic,
    someImages: KeyImages,
    private readonly catalogCovers: CatalogCovers,
  ) {
    super(anAppleMusic, someImages);
  }

  static connectedTo(anAppleMusic: AppleMusic, someImages: KeyImages, someCatalogCovers: CatalogCovers) {
    return new this(anAppleMusic, someImages, someCatalogCovers)
      .followingSituation()
      .followingCatalogCovers();
  }

  private followingCatalogCovers() {
    this.catalogCovers.whenCoverArrives(async () => this.renderVisibleKeys());

    return this;
  }

  protected keyFor(_someSettings: object, aDisplay: Display) {
    return new NowPlayingKey(aDisplay, this.images, this.catalogCovers);
  }
}
