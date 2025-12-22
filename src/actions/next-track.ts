import { action } from "@elgato/streamdeck";
import type { Display } from "../display/display";
import type { KeyImages } from "../images/key-images";
import { NextTrackKey } from "../keys/next-track-key";
import type { AppleMusic } from "../music/apple-music";
import { AppleMusicAction } from "./apple-music-action";

@action({ UUID: "studio.wenoa.applemusic.next-track" })
export class NextTrackAction extends AppleMusicAction {
  static connectedTo(anAppleMusic: AppleMusic, someImages: KeyImages) {
    return new this(anAppleMusic, someImages).followingSituation();
  }

  protected keyFor(_someSettings: object, aDisplay: Display) {
    return new NextTrackKey(aDisplay, this.images);
  }
}
