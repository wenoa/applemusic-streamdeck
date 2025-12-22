// Fetched only when the track changes, or on every check while it's missing.
final class CurrentTrackArtwork {
  private let script: AppleScriptHandlers
  private var rememberedArtwork: TrackArtwork = MissingTrackArtwork()

  init(script aScript: AppleScriptHandlers) {
    self.script = aScript
  }

  func artwork(ofTrackIdentifiedBy aTrackIdentifier: String) -> TrackArtwork {
    if !rememberedArtwork.belongs(to: aTrackIdentifier) {
      rememberedArtwork = fetchedArtwork(ofTrackIdentifiedBy: aTrackIdentifier)
    }

    return rememberedArtwork
  }

  private func fetchedArtwork(ofTrackIdentifiedBy aTrackIdentifier: String) -> TrackArtwork {
    guard let reply = try? script.call("artworkOfCurrentTrack", with: []),
          let artworkTrackIdentifier = reply.atIndex(1)?.stringValue,
          let artworkData = reply.atIndex(2)?.data,
          let image = KeyImage.cover(from: artworkData) else {
      return MissingTrackArtwork()
    }

    // The track may have changed between the snapshot and this request.
    guard artworkTrackIdentifier == aTrackIdentifier else {
      return MissingTrackArtwork()
    }

    return FoundTrackArtwork(trackIdentifier: aTrackIdentifier, image: image)
  }
}
