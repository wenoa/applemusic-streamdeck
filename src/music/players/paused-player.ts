import type { NowPlayingKey } from "../../keys/now-playing-key";
import { PlayerWithTrack } from "./player-with-track";

export class PausedPlayer extends PlayerWithTrack {
  async renderNowPlayingOn(aKey: NowPlayingKey) {
    await aKey.showPlay();
  }
}
