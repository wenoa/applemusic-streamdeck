import type { MusicKey } from "../../keys/music-key";
import type { AppleMusic } from "../apple-music";
import type { Player } from "../players/player";

export interface MusicSituation {
  render(aKey: MusicKey, anAppleMusic: AppleMusic): Promise<void>;

  press(aKey: MusicKey, anAppleMusic: AppleMusic): Promise<void>;
}

export class ClosedMusic implements MusicSituation {
  async render(aKey: MusicKey) {
    await aKey.showClosedMusic();
  }

  async press(_aKey: MusicKey, anAppleMusic: AppleMusic) {
    anAppleMusic.open();
  }
}

export class UnauthorizedMusic implements MusicSituation {
  async render(aKey: MusicKey) {
    await aKey.showUnauthorizedMusic();
  }

  async press(_aKey: MusicKey, anAppleMusic: AppleMusic) {
    anAppleMusic.revealAutomationPermission();
  }
}

export class OpenMusic implements MusicSituation {
  constructor(private readonly player: Player) {
  }

  async render(aKey: MusicKey, anAppleMusic: AppleMusic) {
    await aKey.renderFor(this.player, anAppleMusic);
  }

  async press(aKey: MusicKey, anAppleMusic: AppleMusic) {
    await aKey.pressFor(this.player, anAppleMusic);
  }
}
