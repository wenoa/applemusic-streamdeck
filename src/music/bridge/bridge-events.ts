import type { AppleMusic } from "../apple-music";
import { UserPlaylist } from "../playlists/playlist";
import type { PlaylistCoverDescription, PlaylistDescriptionAnswer } from "../playlists/playlist-cover";
import { ReceivedPlaylistCover, UnavailablePlaylistDescription } from "../playlists/playlist-cover";
import { PausedPlayer } from "../players/paused-player";
import { PlayingPlayer } from "../players/playing-player";
import { StoppedPlayer } from "../players/stopped-player";
import type { MusicSituation } from "../situations/situation";
import { ClosedMusic, OpenMusic, UnauthorizedMusic } from "../situations/situation";
import type { TrackDescription } from "../tracks/track";
import { Track } from "../tracks/track";

export type BridgeEventData = {
  type?: unknown;
  id?: unknown;
  track?: TrackDescription;
  playlists?: unknown;
  playlist?: PlaylistCoverDescription & { id?: unknown };
};

export interface BridgeEvent {
  handle(anAppleMusic: AppleMusic): Promise<void>;
}

class SituationEvent implements BridgeEvent {
  constructor(private readonly situation: MusicSituation) {
  }

  async handle(anAppleMusic: AppleMusic) {
    await anAppleMusic.changeSituationTo(this.situation);
  }
}

class PlaylistsEvent implements BridgeEvent {
  constructor(private readonly playlists: UserPlaylist[]) {
  }

  async handle(anAppleMusic: AppleMusic) {
    anAppleMusic.receivePlaylists(this.playlists);
  }
}

class PlaylistDescriptionEvent implements BridgeEvent {
  constructor(
    private readonly playlistIdentifier: unknown,
    private readonly answer: PlaylistDescriptionAnswer,
  ) {
  }

  async handle(anAppleMusic: AppleMusic) {
    anAppleMusic.receivePlaylistDescription(this.playlistIdentifier, this.answer);
  }
}

class IgnoredEvent implements BridgeEvent {
  async handle() {
  }
}

type EventFromData = (data: BridgeEventData) => BridgeEvent;

export class BridgeEventRegistry {
  private readonly events = new Map<unknown, EventFromData>([
    ["closed", () => new SituationEvent(new ClosedMusic())],
    ["unauthorized", () => new SituationEvent(new UnauthorizedMusic())],
    ["stopped", () => new SituationEvent(new OpenMusic(new StoppedPlayer()))],
    ["paused", data => new SituationEvent(new OpenMusic(new PausedPlayer(Track.fromBridge(data.track))))],
    ["playing", data => new SituationEvent(new OpenMusic(new PlayingPlayer(Track.fromBridge(data.track))))],
    ["playlists", data => new PlaylistsEvent(UserPlaylist.allFromBridge(data.playlists))],
    ["playlist", ({ playlist = {} }) => new PlaylistDescriptionEvent(playlist.id, ReceivedPlaylistCover.fromBridge(playlist))],
    ["playlistUnavailable", data => new PlaylistDescriptionEvent(data.id, new UnavailablePlaylistDescription())],
  ]);

  eventFrom(someData: BridgeEventData) {
    const eventFromData = this.events.get(someData.type) ?? (() => new IgnoredEvent());

    return eventFromData(someData);
  }
}
