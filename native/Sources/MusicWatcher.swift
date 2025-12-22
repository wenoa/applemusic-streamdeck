import AppKit

final class MusicWatcher {
  // Music announces every track and playback change with this undocumented distributed notification.
  private static let playerInformation = Notification.Name("com.apple.Music.playerInfo")

  private let music: Music
  private let application: InstalledMusicApplication

  init(music aMusic: Music, application anApplication: InstalledMusicApplication) {
    self.music = aMusic
    self.application = anApplication
  }

  func startWatching() {
    DistributedNotificationCenter.default().addObserver(
      forName: MusicWatcher.playerInformation,
      object: nil,
      queue: .main
    ) { _ in
      self.music.reportSituation()
    }

    [NSWorkspace.didLaunchApplicationNotification, NSWorkspace.didTerminateApplicationNotification].forEach { name in
      NSWorkspace.shared.notificationCenter.addObserver(forName: name, object: nil, queue: .main) { notification in
        if self.application.isSubject(of: notification) {
          self.music.reportSituation()
        }
      }
    }
  }
}
