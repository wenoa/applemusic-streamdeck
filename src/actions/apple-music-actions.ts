import type { SingletonAction } from "@elgato/streamdeck";
import type { KeyImages } from "../images/key-images";
import type { AppleMusic } from "../music/apple-music";
import type { CatalogCovers } from "../music/catalog/catalog-covers";
import { FavoriteAction } from "./favorite";
import { NextTrackAction } from "./next-track";
import { NowPlayingAction } from "./now-playing";
import { PlaylistAction } from "./playlist";
import { PreviousTrackAction } from "./previous-track";
import type { PropertyInspector } from "./property-inspector";
import { VolumeAction } from "./volume";

export class AppleMusicActions {
  constructor(
    private readonly music: AppleMusic,
    private readonly images: KeyImages,
    private readonly propertyInspector: PropertyInspector,
    private readonly catalogCovers: CatalogCovers,
  ) {
  }

  forEach(aClosure: (action: SingletonAction<any>) => void) {
    [
      NowPlayingAction.connectedTo(this.music, this.images, this.catalogCovers),
      FavoriteAction.connectedTo(this.music, this.images),
      PreviousTrackAction.connectedTo(this.music, this.images),
      NextTrackAction.connectedTo(this.music, this.images),
      VolumeAction.connectedTo(this.music, this.images),
      PlaylistAction.connectedTo(this.music, this.images, this.propertyInspector),
    ].forEach(aClosure);
  }
}
