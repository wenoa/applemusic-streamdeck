struct UserPlaylist {
  let identifier: String
  let name: String

  func description() -> [String: Any] {
    [
      "id": identifier,
      "name": name,
    ]
  }
}

struct UserPlaylists: PluginEvent {
  let playlists: [UserPlaylist]

  func event() -> [String: Any] {
    [
      "type": "playlists",
      "playlists": playlists.map { playlist in playlist.description() },
    ]
  }
}

// Music is closed, so it can't describe the playlist now.
struct UnavailablePlaylist: PluginEvent {
  let identifier: String

  func event() -> [String: Any] {
    [
      "type": "playlistUnavailable",
      "id": identifier,
    ]
  }
}

struct UndescribedPlaylist: PluginEvent {
  let identifier: String

  func event() -> [String: Any] {
    [
      "type": "playlist",
      "playlist": ["id": identifier],
    ]
  }
}

struct DescribedPlaylist: PluginEvent {
  let identifier: String
  let name: String
  let cover: PlaylistCover

  func event() -> [String: Any] {
    [
      "type": "playlist",
      "playlist": cover.describe([
        "id": identifier,
        "name": name,
      ]),
    ]
  }
}

protocol PlaylistCover {
  func describe(_ aDescription: [String: Any]) -> [String: Any]
}

struct MosaicPlaylistCover: PlaylistCover {
  let image: KeyImage

  func describe(_ aDescription: [String: Any]) -> [String: Any] {
    image.describeAsArtwork(aDescription)
  }
}

struct MissingPlaylistCover: PlaylistCover {
  func describe(_ aDescription: [String: Any]) -> [String: Any] {
    aDescription
  }
}
