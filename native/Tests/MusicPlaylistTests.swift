import AppKit
import Testing
@testable import MusicBridge

@Suite struct MusicPlaylistTests {
  let plugin = FakePlugin()

  func execute(_ message: [String: Any], on script: FakeMusicScript, running: Bool) {
    PluginCommandRegistry()
      .command(from: message)
      .execute(on: Music.controlling(script, through: FakeMusicApplication(isRunning: running), reportingTo: plugin))
  }

  func description(name: String, artworks: [Data]) -> NSAppleEventDescriptor {
    Descriptors.list([Descriptors.text(name), Descriptors.list(artworks.map(Descriptors.data))])
  }

  @Test func listsThePlaylists() {
    let script = FakeMusicScript().replying(to: "listPlaylists", with: Descriptors.list([
      Descriptors.list([Descriptors.text("26C1"), Descriptors.text("9A0F")]),
      Descriptors.list([Descriptors.text("Work"), Descriptors.text("Road")]),
    ]))

    execute(["command": "listPlaylists"], on: script, running: true)

    #expect(plugin.events() == [[
      "type": "playlists",
      "playlists": [
        ["id": "26C1", "name": "Work"],
        ["id": "9A0F", "name": "Road"],
      ],
    ]])
  }

  @Test func leavesOutPlaylistsWithoutName() {
    let script = FakeMusicScript().replying(to: "listPlaylists", with: Descriptors.list([
      Descriptors.list([Descriptors.text("26C1"), Descriptors.text("9A0F")]),
      Descriptors.list([Descriptors.text("Work")]),
    ]))

    execute(["command": "listPlaylists"], on: script, running: true)

    #expect(plugin.events() == [["type": "playlists", "playlists": [["id": "26C1", "name": "Work"]]]])
  }

  @Test func listsNoPlaylistsWhenMusicHasNone() {
    let script = FakeMusicScript().replying(to: "listPlaylists", with: Descriptors.list([Descriptors.list([]), Descriptors.list([])]))

    execute(["command": "listPlaylists"], on: script, running: true)

    #expect(plugin.events() == [["type": "playlists", "playlists": []]])
  }

  @Test func listsNoPlaylistsWhenMusicIsClosed() {
    let script = FakeMusicScript()

    execute(["command": "listPlaylists"], on: script, running: false)

    #expect(plugin.events() == [["type": "playlists", "playlists": []]])
    #expect(script.handlersCalled() == [])
  }

  @Test func listsNoPlaylistsWhenMusicFailsToListThem() {
    let script = FakeMusicScript().failing("listPlaylists", with: AppleScriptFailure(number: -1728, message: "no playlists"))

    execute(["command": "listPlaylists"], on: script, running: true)

    #expect(plugin.events() == [["type": "playlists", "playlists": []]])
  }

  @Test func reportsAPlaylistUnavailableWhenMusicIsClosed() {
    let script = FakeMusicScript()

    execute(["command": "describePlaylist", "playlist": "26C1"], on: script, running: false)

    #expect(plugin.events() == [["type": "playlistUnavailable", "id": "26C1"]])
    #expect(script.handlersCalled() == [])
  }

  @Test func asksForTheArtworksOfTheMosaic() {
    let script = FakeMusicScript()

    execute(["command": "describePlaylist", "playlist": "26C1"], on: script, running: true)

    let arguments = script.argumentsOfLastCall(to: "describePlaylist")
    #expect(arguments.first?.stringValue == "26C1")
    #expect(arguments.dropFirst().map { argument in argument.int32Value } == [4, 50])
  }

  @Test(arguments: [1, 3, 4]) func describesThePlaylistWithItsCover(artworks: Int) {
    let script = FakeMusicScript().replying(
      to: "describePlaylist",
      with: description(name: "Work", artworks: (0..<artworks).map { position in Artworks.png(red: CGFloat(position) / 4) })
    )

    execute(["command": "describePlaylist", "playlist": "26C1"], on: script, running: true)

    let playlist = plugin.lastEvent()["playlist"] as? NSDictionary
    #expect(plugin.lastEvent()["type"] as? String == "playlist")
    #expect(playlist?["id"] as? String == "26C1")
    #expect(playlist?["name"] as? String == "Work")
    #expect((playlist?["artwork"] as? String)?.hasPrefix("data:image/png;base64,") == true)
  }

  func redsOfTheQuadrantsOfTheCover() -> [Int] {
    let artwork = ((plugin.lastEvent()["playlist"] as? NSDictionary)?["artwork"] as? String) ?? ""
    let png = Data(base64Encoded: String(artwork.dropFirst("data:image/png;base64,".count))) ?? Data()
    let cover = NSBitmapImageRep(data: png)

    return [(36, 36), (108, 36), (36, 108), (108, 108)].map { x, y in
      Int(((cover?.colorAt(x: x, y: y)?.redComponent ?? -1) * 4).rounded())
    }
  }

  @Test func coversThePlaylistWithAMosaicOfItsFirstFourArtworks() {
    let script = FakeMusicScript().replying(
      to: "describePlaylist",
      with: description(name: "Work", artworks: [1, 0.75, 0.5, 0.25].map { red in Artworks.png(red: red) })
    )

    execute(["command": "describePlaylist", "playlist": "26C1"], on: script, running: true)

    #expect(redsOfTheQuadrantsOfTheCover() == [4, 3, 2, 1])
  }

  @Test func coversThePlaylistWithItsFirstArtworkWhenItHasLessThanFour() {
    let script = FakeMusicScript().replying(
      to: "describePlaylist",
      with: description(name: "Work", artworks: [1, 0.75, 0.5].map { red in Artworks.png(red: red) })
    )

    execute(["command": "describePlaylist", "playlist": "26C1"], on: script, running: true)

    #expect(redsOfTheQuadrantsOfTheCover() == [4, 4, 4, 4])
  }

  @Test func describesThePlaylistByNameWhenItHasNoCover() {
    let script = FakeMusicScript().replying(to: "describePlaylist", with: description(name: "Work", artworks: [Artworks.notAnImage]))

    execute(["command": "describePlaylist", "playlist": "26C1"], on: script, running: true)

    #expect(plugin.events() == [["type": "playlist", "playlist": ["id": "26C1", "name": "Work"]]])
  }

  @Test func describesThePlaylistByNameWhenItHasNoTracks() {
    let script = FakeMusicScript().replying(to: "describePlaylist", with: description(name: "Work", artworks: []))

    execute(["command": "describePlaylist", "playlist": "26C1"], on: script, running: true)

    #expect(plugin.events() == [["type": "playlist", "playlist": ["id": "26C1", "name": "Work"]]])
  }

  @Test func identifiesThePlaylistWhenMusicCanNotDescribeIt() {
    let script = FakeMusicScript().failing("describePlaylist", with: AppleScriptFailure(number: -1728, message: "no playlist"))

    execute(["command": "describePlaylist", "playlist": "26C1"], on: script, running: true)

    #expect(plugin.events() == [["type": "playlist", "playlist": ["id": "26C1"]]])
  }
}
