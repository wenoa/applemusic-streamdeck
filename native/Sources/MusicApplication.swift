import AppKit

protocol MusicApplication {
  var isRunning: Bool { get }

  func open()

  func revealAutomationPermission()
}

struct InstalledMusicApplication: MusicApplication {
  private static let bundleIdentifier = "com.apple.Music"
  private static let automationSettings = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation")!

  var isRunning: Bool {
    NSRunningApplication
      .runningApplications(withBundleIdentifier: Self.bundleIdentifier)
      .contains { application in !application.isTerminated }
  }

  func open() {
    NSWorkspace.shared.urlForApplication(withBundleIdentifier: Self.bundleIdentifier).map { application in
      NSWorkspace.shared.openApplication(at: application, configuration: NSWorkspace.OpenConfiguration())
    }
  }

  func revealAutomationPermission() {
    NSWorkspace.shared.open(Self.automationSettings)
  }

  func isSubject(of aWorkspaceNotification: Notification) -> Bool {
    let application = aWorkspaceNotification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication

    return application?.bundleIdentifier == Self.bundleIdentifier
  }
}
