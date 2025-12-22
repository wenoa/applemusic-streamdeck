import Foundation

let plugin = PluginChannel()

do {
  let music = try Music.reporting(to: plugin)
  let commands = PluginCommandRegistry()

  MusicWatcher(music: music, application: InstalledMusicApplication()).startWatching()
  plugin.listen { message in
    commands
      .command(from: message)
      .execute(on: music)
  }
  music.reportSituation()

  RunLoop.main.run()
} catch {
  plugin.log("Could not compile the Music script: \(error)")
  exit(1)
}
