import Foundation

final class Music {
  private let script: AppleScriptHandlers
  private let application: MusicApplication
  private let plugin: PluginConnection
  private let situationOfMusic: SituationOfMusic
  private let playlists: PlaylistLibrary
  private var lastReportedSituation = ""

  private init(
    script aScript: AppleScriptHandlers,
    application anApplication: MusicApplication,
    plugin aPlugin: PluginConnection,
    situationOfMusic aSituationOfMusic: SituationOfMusic,
    playlists somePlaylists: PlaylistLibrary
  ) {
    self.script = aScript
    self.application = anApplication
    self.plugin = aPlugin
    self.situationOfMusic = aSituationOfMusic
    self.playlists = somePlaylists
  }

  static func reporting(to aPlugin: PluginConnection) throws -> Music {
    controlling(
      try AppleScriptLibrary.compiled(from: musicScriptSource),
      through: InstalledMusicApplication(),
      reportingTo: aPlugin
    )
  }

  static func controlling(_ aScript: MusicScript, through anApplication: MusicApplication, reportingTo aPlugin: PluginConnection) -> Music {
    let handlers = HandlersOfOpenMusic(script: aScript, application: anApplication)

    return Music(
      script: handlers,
      application: anApplication,
      plugin: aPlugin,
      situationOfMusic: SituationOfMusic(script: handlers, currentTrackArtwork: CurrentTrackArtwork(script: handlers), plugin: aPlugin),
      playlists: PlaylistLibrary(script: handlers)
    )
  }

  func reportSituation() {
    let situation = situationOfMusic
      .current()
      .serialized()

    guard situation != lastReportedSituation else {
      return
    }

    lastReportedSituation = situation
    plugin.send(situation)
  }

  func open() {
    application.open()
  }

  func revealAutomationPermission() {
    application.revealAutomationPermission()
  }

  func togglePlayback() {
    command("togglePlayback", with: [])
  }

  func skipToNextTrack() {
    command("skipToNextTrack", with: [])
  }

  func returnToPreviousTrack() {
    command("returnToPreviousTrack", with: [])
  }

  func toggleFavoriteOfCurrentTrack() {
    command("toggleFavoriteOfCurrentTrack", with: [])
  }

  func changeVolume(by somePoints: Int) {
    command("changeVolumeBy", with: [NSAppleEventDescriptor(int32: Int32(somePoints))])
  }

  func play(playlistIdentifier aPlaylistIdentifier: String) {
    command("playPlaylist", with: [NSAppleEventDescriptor(string: aPlaylistIdentifier)])
  }

  func reportPlaylists() {
    plugin.report(playlists.all())
  }

  func reportPlaylist(identifiedBy aPlaylistIdentifier: String) {
    plugin.report(playlists.description(ofPlaylistIdentifiedBy: aPlaylistIdentifier))
  }

  private func command(_ aHandlerName: String, with someArguments: [NSAppleEventDescriptor]) {
    do {
      _ = try script.call(aHandlerName, with: someArguments)
    } catch is MusicIsClosed {
      // Nothing to do: the situation reported next says Music is closed.
    } catch let failure as AppleScriptFailure {
      plugin.log("\(aHandlerName) failed: \(failure.number) \(failure.message)")
    } catch {
      plugin.log("\(aHandlerName) failed: \(error)")
    }

    reportSituation()
  }
}
