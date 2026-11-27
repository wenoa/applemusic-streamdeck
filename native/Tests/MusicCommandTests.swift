import Foundation
import Testing
@testable import MusicBridge

@Suite struct MusicCommandTests {
  let plugin = FakePlugin()
  let script = FakeMusicScript().replying(to: "snapshot", with: Descriptors.list([Descriptors.text("stopped")]))

  func execute(_ message: [String: Any], running: Bool) -> FakeMusicApplication {
    let application = FakeMusicApplication(isRunning: running)
    PluginCommandRegistry()
      .command(from: message)
      .execute(on: Music.controlling(script, through: application, reportingTo: plugin))

    return application
  }

  @Test(arguments: [
    ("togglePlayback", "togglePlayback"),
    ("skipToNextTrack", "skipToNextTrack"),
    ("returnToPreviousTrack", "returnToPreviousTrack"),
    ("toggleFavorite", "toggleFavoriteOfCurrentTrack"),
  ]) func runsTheHandlerOfTheCommandAndReportsTheSituation(command: String, handler: String) {
    _ = execute(["command": command], running: true)

    #expect(script.handlersCalled() == [handler, "snapshot"])
    #expect(plugin.events() == [["type": "stopped"]])
  }

  @Test func changesTheVolumeByThePercentagePoints() {
    _ = execute(["command": "changeVolume", "percentagePoints": -15], running: true)

    #expect(script.argumentsOfLastCall(to: "changeVolumeBy").map { argument in argument.int32Value } == [-15])
  }

  @Test func playsThePlaylist() {
    _ = execute(["command": "playPlaylist", "playlist": "26C1"], running: true)

    #expect(script.argumentsOfLastCall(to: "playPlaylist").map { argument in argument.stringValue } == ["26C1"])
  }

  @Test(arguments: [
    ["command": "changeVolume", "percentagePoints": "much"],
    ["command": "changeVolume"],
    ["command": "playPlaylist", "playlist": 7],
    ["command": "describePlaylist"],
    ["command": "unknown"],
    ["percentagePoints": 5],
  ] as [[String: Any]]) func ignoresMalformedCommands(message: [String: Any]) {
    _ = execute(message, running: true)

    #expect(script.handlersCalled() == [])
    #expect(plugin.events() == [])
  }

  @Test func doesNotAskAClosedMusicToRunACommand() {
    _ = execute(["command": "togglePlayback"], running: false)

    #expect(script.handlersCalled() == [])
    #expect(plugin.events() == [["type": "closed"]])
  }

  @Test func doesNotOpenAgainAMusicThatQuitsDuringACommand() {
    let application = FakeMusicApplication(isRunning: true)
    _ = script.quittingMusic(application, during: "togglePlayback")

    PluginCommandRegistry()
      .command(from: ["command": "togglePlayback"])
      .execute(on: Music.controlling(script, through: application, reportingTo: plugin))

    #expect(plugin.events() == [["type": "closed"]])
  }

  @Test func logsAFailedCommand() {
    _ = script.failing("togglePlayback", with: AppleScriptFailure(number: -1728, message: "no track"))

    _ = execute(["command": "togglePlayback"], running: true)

    #expect(plugin.logs == ["togglePlayback failed: -1728 no track"])
    #expect(plugin.events() == [["type": "stopped"]])
  }

  @Test func opensMusic() {
    let application = execute(["command": "open"], running: false)

    #expect(application.openings == 1)
  }

  @Test func revealsTheAutomationPermission() {
    let application = execute(["command": "revealAutomationPermission"], running: true)

    #expect(application.automationPermissionRevelations == 1)
  }

  @Test func reportsTheSituationWhenAsked() {
    _ = execute(["command": "reportSituation"], running: true)

    #expect(plugin.events() == [["type": "stopped"]])
  }
}
