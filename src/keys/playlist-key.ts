import type { Listeners } from "../core/listeners";
import type { Display } from "../display/display";
import type { KeyImage } from "../images/key-image";
import type { KeyImages } from "../images/key-images";
import type { AppleMusic } from "../music/apple-music";
import type { UserPlaylist } from "../music/playlists/playlist";
import type { PlaylistCover, ReceivedPlaylistCover } from "../music/playlists/playlist-cover";
import { RequestedPlaylistCover, UnrequestedPlaylistCover } from "../music/playlists/playlist-cover";
import type { Player } from "../music/players/player";
import { MusicKey } from "./music-key";

export class ConfiguredPlaylistKey extends MusicKey {
  private cover: PlaylistCover = new UnrequestedPlaylistCover();

  constructor(
    aDisplay: Display,
    someImages: KeyImages,
    private readonly playlist: UserPlaylist,
    private readonly coverArrivals: Listeners,
  ) {
    super(aDisplay, someImages);
  }

  async renderFor(_aPlayer: Player, anAppleMusic: AppleMusic) {
    await this.cover.renderOn(this, anAppleMusic);
  }

  async pressFor(_aPlayer: Player, anAppleMusic: AppleMusic) {
    anAppleMusic.play(this.playlist);
  }

  async requestCover(anAppleMusic: AppleMusic) {
    this.cover = new RequestedPlaylistCover();
    void anAppleMusic
      .describe(this.playlist)
      .then(answer => answer.receivedBy(this));
    await this.showOwnName();
  }

  forgetCover() {
    this.cover = new UnrequestedPlaylistCover();
  }

  async adopt(aCover: ReceivedPlaylistCover) {
    this.cover = aCover;
    await this.coverArrivals.notify();
  }

  async showArtwork(anArtwork: KeyImage) {
    await this.display.show(anArtwork);
  }

  async showName(aName: string) {
    await this.display.show(this.images.playlistNamed(aName));
  }

  async showOwnName() {
    await this.playlist.renderNameOn(this);
  }
}

export class UnconfiguredPlaylistKey extends MusicKey {
  async renderFor() {
    await this.display.show(this.images.missingPlaylist());
  }

  async pressFor() {
    await this.alert();
  }
}
