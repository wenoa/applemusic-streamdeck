import { action } from "@elgato/streamdeck";
import type { Display } from "../display/display";
import type { KeyImages } from "../images/key-images";
import { VolumeKey } from "../keys/volume-key";
import { VolumeChange } from "../music/volume-change";
import type { AppleMusic } from "../music/apple-music";
import { AppleMusicAction } from "./apple-music-action";

type VolumeSettings = {
  volumeChange?: string;
};

@action({ UUID: "studio.wenoa.applemusic.volume" })
export class VolumeAction extends AppleMusicAction<VolumeSettings> {
  static connectedTo(anAppleMusic: AppleMusic, someImages: KeyImages) {
    return new this(anAppleMusic, someImages).followingSituation();
  }

  protected keyFor({ volumeChange }: VolumeSettings, aDisplay: Display) {
    return new VolumeKey(aDisplay, this.images, VolumeChange.fromSetting(volumeChange));
  }
}
