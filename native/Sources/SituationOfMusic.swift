import Foundation

final class SituationOfMusic {
  private let script: AppleScriptHandlers
  private let currentTrackArtwork: CurrentTrackArtwork
  private let plugin: PluginConnection

  init(script aScript: AppleScriptHandlers, currentTrackArtwork aCurrentTrackArtwork: CurrentTrackArtwork, plugin aPlugin: PluginConnection) {
    self.script = aScript
    self.currentTrackArtwork = aCurrentTrackArtwork
    self.plugin = aPlugin
  }

  func current() -> Situation {
    do {
      return situation(from: try script.call("snapshot", with: []))
    } catch is MusicIsClosed {
      return ClosedMusic()
    } catch let failure as AppleScriptFailure where failure.isPermissionDenial {
      return UnauthorizedMusic()
    } catch {
      plugin.log("snapshot failed: \(error)")
      return StoppedPlayer()
    }
  }

  private func situation(from aSnapshot: NSAppleEventDescriptor) -> Situation {
    let situationsWithTrack: [String: (Track) -> Situation] = [
      "playing": PlayingPlayer.init,
      "paused": PausedPlayer.init,
    ]

    guard aSnapshot.numberOfItems == 5,
          let state = aSnapshot.atIndex(1)?.stringValue,
          let trackIdentifier = aSnapshot.atIndex(2)?.stringValue,
          let favorited = aSnapshot.atIndex(3)?.booleanValue,
          let artist = aSnapshot.atIndex(4)?.stringValue,
          let album = aSnapshot.atIndex(5)?.stringValue,
          let situationWithTrack = situationsWithTrack[state] else {
      return StoppedPlayer()
    }

    return situationWithTrack(Track(
      identifier: trackIdentifier,
      favorited: favorited,
      artist: artist,
      album: album,
      artwork: currentTrackArtwork.artwork(ofTrackIdentifiedBy: trackIdentifier)
    ))
  }
}
