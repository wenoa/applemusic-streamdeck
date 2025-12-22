import type { NowPlayingKey } from "../../keys/now-playing-key";
import { PlayerWithTrack } from "./player-with-track";

export class PlayingPlayer extends PlayerWithTrack {
  async renderNowPlayingOn(aKey: NowPlayingKey) {
    await this.track.renderArtworkOn(aKey);
  }
}
