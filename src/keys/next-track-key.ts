import type { AppleMusic } from "../music/apple-music";
import type { Player } from "../music/players/player";
import { MusicKey } from "./music-key";

export class NextTrackKey extends MusicKey {
  async renderFor() {
    await this.display.show(this.images.nextTrack());
  }

  async pressFor(_aPlayer: Player, anAppleMusic: AppleMusic) {
    anAppleMusic.skipToNextTrack();
  }
}
