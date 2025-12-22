protocol PluginCommand {
  func execute(on aMusic: Music)
}

struct OpenMusicCommand: PluginCommand {
  func execute(on aMusic: Music) {
    aMusic.open()
  }
}

struct RevealAutomationPermissionCommand: PluginCommand {
  func execute(on aMusic: Music) {
    aMusic.revealAutomationPermission()
  }
}

struct TogglePlaybackCommand: PluginCommand {
  func execute(on aMusic: Music) {
    aMusic.togglePlayback()
  }
}

struct SkipToNextTrackCommand: PluginCommand {
  func execute(on aMusic: Music) {
    aMusic.skipToNextTrack()
  }
}

struct ReturnToPreviousTrackCommand: PluginCommand {
  func execute(on aMusic: Music) {
    aMusic.returnToPreviousTrack()
  }
}

struct ToggleFavoriteCommand: PluginCommand {
  func execute(on aMusic: Music) {
    aMusic.toggleFavoriteOfCurrentTrack()
  }
}

struct ChangeVolumeCommand: PluginCommand {
  let points: Int

  func execute(on aMusic: Music) {
    aMusic.changeVolume(by: points)
  }
}

struct PlayPlaylistCommand: PluginCommand {
  let playlistIdentifier: String

  func execute(on aMusic: Music) {
    aMusic.play(playlistIdentifier: playlistIdentifier)
  }
}

struct ListPlaylistsCommand: PluginCommand {
  func execute(on aMusic: Music) {
    aMusic.reportPlaylists()
  }
}

struct DescribePlaylistCommand: PluginCommand {
  let playlistIdentifier: String

  func execute(on aMusic: Music) {
    aMusic.reportPlaylist(identifiedBy: playlistIdentifier)
  }
}

struct ReportSituationCommand: PluginCommand {
  func execute(on aMusic: Music) {
    aMusic.reportSituation()
  }
}

struct IgnoredCommand: PluginCommand {
  func execute(on aMusic: Music) {
  }
}

struct PluginCommandRegistry {
  private let commands: [String: ([String: Any]) -> PluginCommand] = [
    "open": { _ in OpenMusicCommand() },
    "revealAutomationPermission": { _ in RevealAutomationPermissionCommand() },
    "togglePlayback": { _ in TogglePlaybackCommand() },
    "skipToNextTrack": { _ in SkipToNextTrackCommand() },
    "returnToPreviousTrack": { _ in ReturnToPreviousTrackCommand() },
    "toggleFavorite": { _ in ToggleFavoriteCommand() },
    "changeVolume": { message in
      Self.command(from: message, with: "percentagePoints", ChangeVolumeCommand.init(points:))
    },
    "playPlaylist": { message in
      Self.command(from: message, with: "playlist", PlayPlaylistCommand.init(playlistIdentifier:))
    },
    "listPlaylists": { _ in ListPlaylistsCommand() },
    "describePlaylist": { message in
      Self.command(from: message, with: "playlist", DescribePlaylistCommand.init(playlistIdentifier:))
    },
    "reportSituation": { _ in ReportSituationCommand() },
  ]

  // A command whose parameter is missing or of another kind is ignored.
  private static func command<Parameter, Command: PluginCommand>(
    from aMessage: [String: Any],
    with aParameterName: String,
    _ aCommandFromParameter: (Parameter) -> Command
  ) -> PluginCommand {
    (aMessage[aParameterName] as? Parameter).map { parameter -> PluginCommand in aCommandFromParameter(parameter) } ?? IgnoredCommand()
  }

  func command(from aMessage: [String: Any]) -> PluginCommand {
    (aMessage["command"] as? String)
      .flatMap { name in commands[name] }
      .map { commandFrom in commandFrom(aMessage) } ?? IgnoredCommand()
  }
}
