import type { UserPlaylist } from "./playlist";
import type { PlaylistDescriptionAnswer } from "./playlist-cover";
import { UnavailablePlaylistDescription } from "./playlist-cover";

class PendingPlaylistDescription {
  constructor(
    private readonly playlist: UserPlaylist,
    private readonly deliver: (answer: PlaylistDescriptionAnswer) => void,
  ) {
  }

  isAnsweredBy(aPlaylistIdentifier: unknown) {
    return this.playlist.isIdentifiedBy(aPlaylistIdentifier);
  }

  answer(anAnswer: PlaylistDescriptionAnswer) {
    this.deliver(anAnswer);
  }

  // The bridge will never answer, so nothing waits for it forever.
  abandon() {
    this.deliver(new UnavailablePlaylistDescription());
  }
}

export class PlaylistListRequests {
  private pendingDeliveries: ((playlists: UserPlaylist[]) => void)[] = [];

  awaitAnswer() {
    return new Promise<UserPlaylist[]>(deliver => {
      this.pendingDeliveries = [...this.pendingDeliveries, deliver];
    });
  }

  answer(somePlaylists: UserPlaylist[]) {
    const pendingDeliveries = this.pendingDeliveries;
    this.pendingDeliveries = [];
    pendingDeliveries.forEach(deliver => deliver(somePlaylists));
  }

  // The bridge will never answer, so nothing waits for it forever.
  releaseAll() {
    this.answer([]);
  }
}

export class PlaylistDescriptionRequests {
  private pendingDescriptions: PendingPlaylistDescription[] = [];

  awaitAnswerFor(aPlaylist: UserPlaylist) {
    return new Promise<PlaylistDescriptionAnswer>(deliver => {
      this.pendingDescriptions = [...this.pendingDescriptions, new PendingPlaylistDescription(aPlaylist, deliver)];
    });
  }

  answer(aPlaylistIdentifier: unknown, anAnswer: PlaylistDescriptionAnswer) {
    const answered = this.pendingDescriptions.filter(pending => pending.isAnsweredBy(aPlaylistIdentifier));
    this.pendingDescriptions = this.pendingDescriptions.filter(pending => !answered.includes(pending));
    answered.forEach(pending => pending.answer(anAnswer));
  }

  releaseAll() {
    const pendingDescriptions = this.pendingDescriptions;
    this.pendingDescriptions = [];
    pendingDescriptions.forEach(pending => pending.abandon());
  }
}
