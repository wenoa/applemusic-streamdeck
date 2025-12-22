import Foundation

final class PlaylistLibrary {
  private static let artworksInMosaic = 4
  private static let tracksExaminedForMosaic = 50

  private let script: AppleScriptHandlers

  init(script aScript: AppleScriptHandlers) {
    self.script = aScript
  }

  func all() -> UserPlaylists {
    guard let reply = try? script.call("listPlaylists", with: []),
          let identifiers = reply.atIndex(1),
          let names = reply.atIndex(2),
          identifiers.numberOfItems > 0 else {
      return UserPlaylists(playlists: [])
    }

    return UserPlaylists(playlists: (1...identifiers.numberOfItems).compactMap { position in
      guard let identifier = identifiers.atIndex(position)?.stringValue,
            let name = names.atIndex(position)?.stringValue else {
        return nil
      }

      return UserPlaylist(identifier: identifier, name: name)
    })
  }

  func description(ofPlaylistIdentifiedBy aPlaylistIdentifier: String) -> PluginEvent {
    do {
      let reply = try script.call("describePlaylist", with: [
        NSAppleEventDescriptor(string: aPlaylistIdentifier),
        NSAppleEventDescriptor(int32: Int32(Self.artworksInMosaic)),
        NSAppleEventDescriptor(int32: Int32(Self.tracksExaminedForMosaic)),
      ])

      guard let name = reply.atIndex(1)?.stringValue,
            let artworks = reply.atIndex(2) else {
        return UndescribedPlaylist(identifier: aPlaylistIdentifier)
      }

      return DescribedPlaylist(identifier: aPlaylistIdentifier, name: name, cover: cover(from: artworks))
    } catch is MusicIsClosed {
      return UnavailablePlaylist(identifier: aPlaylistIdentifier)
    } catch {
      return UndescribedPlaylist(identifier: aPlaylistIdentifier)
    }
  }

  private func cover(from someArtworks: NSAppleEventDescriptor) -> PlaylistCover {
    let artworksData = someArtworks.numberOfItems == 0 ? [] : (1...someArtworks.numberOfItems).compactMap { position in
      someArtworks.atIndex(position)?.data
    }

    return KeyImage
      .mosaic(from: artworksData)
      .map { mosaic -> PlaylistCover in MosaicPlaylistCover(image: mosaic) } ?? MissingPlaylistCover()
  }
}
