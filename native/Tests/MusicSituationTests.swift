import Foundation
import Testing
@testable import MusicBridge

@Suite struct MusicSituationTests {
  let plugin = FakePlugin()

  func music(_ script: FakeMusicScript, running: Bool) -> Music {
    Music.controlling(script, through: FakeMusicApplication(isRunning: running), reportingTo: plugin)
  }

  @Test func reportsClosedMusicWithoutAskingIt() {
    let script = FakeMusicScript()

    music(script, running: false).reportSituation()

    #expect(plugin.events() == [["type": "closed"]])
    #expect(script.handlersCalled() == [])
  }

  @Test func reportsUnauthorizedWhenAutomationIsDenied() {
    let script = FakeMusicScript().failing("snapshot", with: AppleScriptFailure(number: -1743, message: "denied"))

    music(script, running: true).reportSituation()

    #expect(plugin.events() == [["type": "unauthorized"]])
  }

  @Test func reportsStoppedAndLogsWhenTheSnapshotFails() {
    let script = FakeMusicScript().failing("snapshot", with: AppleScriptFailure(number: -600, message: "gone"))

    music(script, running: true).reportSituation()

    #expect(plugin.events() == [["type": "stopped"]])
    #expect(plugin.logs.count == 1)
  }

  @Test func doesNotOpenAgainAMusicThatQuitsWhileItsSituationIsRead() {
    let application = FakeMusicApplication(isRunning: true)
    let script = FakeMusicScript()
      .replying(to: "snapshot", with: Descriptors.list([Descriptors.text("stopped")]))
      .quittingMusic(application, during: "snapshot")
    let music = Music.controlling(script, through: application, reportingTo: plugin)

    music.reportSituation()
    music.reportSituation()

    #expect(plugin.events() == [["type": "stopped"], ["type": "closed"]])
  }

  @Test func reportsStoppedWhenMusicIsStopped() {
    let script = FakeMusicScript().replying(to: "snapshot", with: Descriptors.list([Descriptors.text("stopped")]))

    music(script, running: true).reportSituation()

    #expect(plugin.events() == [["type": "stopped"]])
  }

  @Test func reportsStoppedForAnUnknownState() {
    let script = FakeMusicScript().replying(
      to: "snapshot",
      with: Descriptors.snapshot("fast forwarding", track: "A1", favorited: false, artist: "Soda", album: "Signos")
    )

    music(script, running: true).reportSituation()

    #expect(plugin.events() == [["type": "stopped"]])
  }

  @Test(arguments: ["playing", "paused"]) func reportsTheTrackOfThePlayer(state: String) {
    let script = FakeMusicScript().replying(
      to: "snapshot",
      with: Descriptors.snapshot(state, track: "A1", favorited: true, artist: "Soda", album: "Signos")
    )

    music(script, running: true).reportSituation()

    #expect(plugin.events() == [[
      "type": state,
      "track": [
        "id": "A1",
        "favorited": true,
        "artist": "Soda",
        "album": "Signos",
      ],
    ]])
  }

  @Test func includesTheCoverOfThePlayingTrack() {
    let script = FakeMusicScript()
      .replying(to: "snapshot", with: Descriptors.snapshot("playing", track: "A1", favorited: false, artist: "Soda", album: "Signos"))
      .replying(to: "artworkOfCurrentTrack", with: Descriptors.artwork(of: "A1", Artworks.png(red: 1)))

    music(script, running: true).reportSituation()

    let track = plugin.lastEvent()["track"] as? NSDictionary
    #expect((track?["artwork"] as? String)?.hasPrefix("data:image/png;base64,") == true)
  }

  @Test func leavesOutTheCoverOfAnotherTrack() {
    let script = FakeMusicScript()
      .replying(to: "snapshot", with: Descriptors.snapshot("playing", track: "A1", favorited: false, artist: "Soda", album: "Signos"))
      .replying(to: "artworkOfCurrentTrack", with: Descriptors.artwork(of: "B2", Artworks.png(red: 1)))

    music(script, running: true).reportSituation()

    let track = plugin.lastEvent()["track"] as? NSDictionary
    #expect(track?["artwork"] == nil)
  }

  @Test func leavesOutACoverThatIsNotAnImage() {
    let script = FakeMusicScript()
      .replying(to: "snapshot", with: Descriptors.snapshot("playing", track: "A1", favorited: false, artist: "Soda", album: "Signos"))
      .replying(to: "artworkOfCurrentTrack", with: Descriptors.artwork(of: "A1", Artworks.notAnImage))

    music(script, running: true).reportSituation()

    let track = plugin.lastEvent()["track"] as? NSDictionary
    #expect(track?["artwork"] == nil)
  }

  @Test func fetchesTheCoverOnlyWhenTheTrackChanges() {
    let script = FakeMusicScript()
      .replying(to: "snapshot", with: Descriptors.snapshot("playing", track: "A1", favorited: false, artist: "Soda", album: "Signos"))
      .replying(to: "artworkOfCurrentTrack", with: Descriptors.artwork(of: "A1", Artworks.png(red: 1)))
    let music = music(script, running: true)
    music.reportSituation()

    _ = script.replying(to: "snapshot", with: Descriptors.snapshot("paused", track: "A1", favorited: true, artist: "Soda", album: "Signos"))
    music.reportSituation()
    _ = script
      .replying(to: "snapshot", with: Descriptors.snapshot("playing", track: "B2", favorited: false, artist: "Soda", album: "Signos"))
      .replying(to: "artworkOfCurrentTrack", with: Descriptors.artwork(of: "B2", Artworks.png(red: 0.5)))
    music.reportSituation()

    #expect(script.callsTo("artworkOfCurrentTrack") == 2)
    #expect(((plugin.events()[1]["track"] as? NSDictionary)?["artwork"] as? String) != nil)
  }

  @Test func asksForAMissingCoverOnEveryCheck() {
    let script = FakeMusicScript()
      .replying(to: "snapshot", with: Descriptors.snapshot("playing", track: "A1", favorited: false, artist: "Soda", album: "Signos"))
    let music = music(script, running: true)

    music.reportSituation()
    music.reportSituation()

    #expect(script.callsTo("artworkOfCurrentTrack") == 2)
  }

  @Test func reportsTheSituationOnlyWhenItChanged() {
    let script = FakeMusicScript().replying(to: "snapshot", with: Descriptors.list([Descriptors.text("stopped")]))
    let music = music(script, running: true)

    music.reportSituation()
    music.reportSituation()

    #expect(plugin.events() == [["type": "stopped"]])
  }
}
