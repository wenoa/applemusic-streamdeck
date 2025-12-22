import { action } from "@elgato/streamdeck";
import type { Display } from "../display/display";
import type { KeyImages } from "../images/key-images";
import { PreviousTrackKey } from "../keys/previous-track-key";
import type { AppleMusic } from "../music/apple-music";
import { AppleMusicAction } from "./apple-music-action";

@action({ UUID: "studio.wenoa.applemusic.previous-track" })
export class PreviousTrackAction extends AppleMusicAction {
  static connectedTo(anAppleMusic: AppleMusic, someImages: KeyImages) {
    return new this(anAppleMusic, someImages).followingSituation();
  }

  protected keyFor(_someSettings: object, aDisplay: Display) {
    return new PreviousTrackKey(aDisplay, this.images);
  }
}
