protocol Situation: PluginEvent {
}

struct ClosedMusic: Situation {
  func event() -> [String: Any] {
    ["type": "closed"]
  }
}

struct UnauthorizedMusic: Situation {
  func event() -> [String: Any] {
    ["type": "unauthorized"]
  }
}

struct StoppedPlayer: Situation {
  func event() -> [String: Any] {
    ["type": "stopped"]
  }
}

struct PausedPlayer: Situation {
  let track: Track

  func event() -> [String: Any] {
    [
      "type": "paused",
      "track": track.description(),
    ]
  }
}

struct PlayingPlayer: Situation {
  let track: Track

  func event() -> [String: Any] {
    [
      "type": "playing",
      "track": track.description(),
    ]
  }
}

struct Track {
  let identifier: String
  let favorited: Bool
  let artist: String
  let album: String
  let artwork: TrackArtwork

  func description() -> [String: Any] {
    artwork.describe([
      "id": identifier,
      "favorited": favorited,
      "artist": artist,
      "album": album,
    ])
  }
}

protocol TrackArtwork {
  func belongs(to aTrackIdentifier: String) -> Bool

  func describe(_ aDescription: [String: Any]) -> [String: Any]
}

struct FoundTrackArtwork: TrackArtwork {
  let trackIdentifier: String
  let image: KeyImage

  func belongs(to aTrackIdentifier: String) -> Bool {
    self.trackIdentifier == aTrackIdentifier
  }

  func describe(_ aDescription: [String: Any]) -> [String: Any] {
    image.describeAsArtwork(aDescription)
  }
}

struct MissingTrackArtwork: TrackArtwork {
  // Music may get the cover later (when the track is added to the library, for instance), so it's asked for again.
  func belongs(to aTrackIdentifier: String) -> Bool {
    false
  }

  func describe(_ aDescription: [String: Any]) -> [String: Any] {
    aDescription
  }
}
