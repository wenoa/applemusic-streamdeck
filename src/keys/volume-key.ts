import type { Display } from "../display/display";
import type { KeyImages } from "../images/key-images";
import type { AppleMusic } from "../music/apple-music";
import type { Player } from "../music/players/player";
import type { VolumeChange } from "../music/volume-change";
import { MusicKey } from "./music-key";

export class VolumeKey extends MusicKey {
  constructor(
    aDisplay: Display,
    someImages: KeyImages,
    private readonly change: VolumeChange,
  ) {
    super(aDisplay, someImages);
  }

  async renderFor() {
    await this.change.renderOn(this);
  }

  async pressFor(_aPlayer: Player, anAppleMusic: AppleMusic) {
    await this.change.applyFrom(this, anAppleMusic);
  }

  async showChange(aCaption: string) {
    await this.display.show(this.images.volumeChange(aCaption));
  }

  async showInvalidChange() {
    await this.display.show(this.images.invalidVolumeChange());
  }
}
