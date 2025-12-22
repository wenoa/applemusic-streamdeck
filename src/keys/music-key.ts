import type { Display } from "../display/display";
import type { KeyImages } from "../images/key-images";
import type { AppleMusic } from "../music/apple-music";
import type { Player } from "../music/players/player";

export abstract class MusicKey {
  constructor(
    protected readonly display: Display,
    protected readonly images: KeyImages,
  ) {
  }

  async showClosedMusic() {
    await this.display.show(this.images.closedMusic());
  }

  async showUnauthorizedMusic() {
    await this.display.show(this.images.unauthorizedMusic());
  }

  async alert() {
    await this.display.alert();
  }

  abstract renderFor(aPlayer: Player, anAppleMusic: AppleMusic): Promise<void>;

  abstract pressFor(aPlayer: Player, anAppleMusic: AppleMusic): Promise<void>;
}
