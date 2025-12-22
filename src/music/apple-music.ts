import { Listeners } from "../core/listeners";
import type { Timer } from "../core/timer";
import type { MusicKey } from "../keys/music-key";
import type { MusicBridge } from "./bridge/music-bridge";
import type { UserPlaylist } from "./playlists/playlist";
import type { PlaylistDescriptionAnswer } from "./playlists/playlist-cover";
import { PlaylistDescriptionRequests, PlaylistListRequests } from "./playlists/playlist-requests";
import { SituationFollowUp } from "./situation-follow-up";
import type { MusicSituation } from "./situations/situation";
import { ClosedMusic } from "./situations/situation";

export class AppleMusic {
  private situation: MusicSituation = new ClosedMusic();
  private readonly situationListeners = new Listeners();
  private readonly playlistListRequests = new PlaylistListRequests();
  private readonly playlistDescriptionRequests = new PlaylistDescriptionRequests();

  constructor(
    private readonly bridge: MusicBridge,
    private readonly situationFollowUp: SituationFollowUp,
  ) {
  }

  static connectedThrough(aBridge: MusicBridge, aSituationFollowUpTimer: Timer) {
    const music = new AppleMusic(aBridge, new SituationFollowUp(aSituationFollowUpTimer));
    aBridge.connect(music);

    return music;
  }

  whenSituationChanges(aListener: () => Promise<void>) {
    this.situationListeners.add(aListener);
  }

  async changeSituationTo(aSituation: MusicSituation) {
    this.situation = aSituation;
    this.followSituation();
    await this.situationListeners.notify();
  }

  async render(aKey: MusicKey) {
    await this.situation.render(aKey, this);
  }

  async press(aKey: MusicKey) {
    await this.situation.press(aKey, this);
  }

  open() {
    this.bridge.send({ command: "open" });
  }

  revealAutomationPermission() {
    this.bridge.send({ command: "revealAutomationPermission" });
  }

  togglePlayback() {
    this.bridge.send({ command: "togglePlayback" });
  }

  skipToNextTrack() {
    this.bridge.send({ command: "skipToNextTrack" });
  }

  returnToPreviousTrack() {
    this.bridge.send({ command: "returnToPreviousTrack" });
  }

  toggleFavoriteOfCurrentTrack() {
    this.bridge.send({ command: "toggleFavorite" });
    this.followSituation();
  }

  changeVolumeBy(somePercentagePoints: number) {
    this.bridge.send({
      command: "changeVolume",
      percentagePoints: somePercentagePoints,
    });
  }

  play(aPlaylist: UserPlaylist) {
    this.bridge.send(aPlaylist.playbackCommand());
  }

  listPlaylists() {
    const playlists = this.playlistListRequests.awaitAnswer();
    this.bridge.send({ command: "listPlaylists" });

    return playlists;
  }

  receivePlaylists(somePlaylists: UserPlaylist[]) {
    this.playlistListRequests.answer(somePlaylists);
  }

  describe(aPlaylist: UserPlaylist) {
    const answer = this.playlistDescriptionRequests.awaitAnswerFor(aPlaylist);
    this.bridge.send(aPlaylist.descriptionCommand());

    return answer;
  }

  receivePlaylistDescription(aPlaylistIdentifier: unknown, anAnswer: PlaylistDescriptionAnswer) {
    this.playlistDescriptionRequests.answer(aPlaylistIdentifier, anAnswer);
  }

  private followSituation() {
    this.situationFollowUp.restart(() => this.bridge.send({ command: "reportSituation" }));
  }

  bridgeDisconnected() {
    this.playlistListRequests.releaseAll();
    this.playlistDescriptionRequests.releaseAll();
  }
}
