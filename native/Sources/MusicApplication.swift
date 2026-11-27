import AppKit

protocol MusicApplication {
  // The running Music process, the one Apple Events are sent to; MusicIsClosed while Music is closed.
  func runningProcess() throws -> NSAppleEventDescriptor

  func open()

  func revealAutomationPermission()
}

struct InstalledMusicApplication: MusicApplication {
  private static let bundleIdentifier = "com.apple.Music"
  private static let automationSettings = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation")!

  // AppleScript addresses a process by its serial number; the conversion fails once the process is gone.
  func runningProcess() throws -> NSAppleEventDescriptor {
    guard let process = NSRunningApplication
      .runningApplications(withBundleIdentifier: Self.bundleIdentifier)
      .first(where: { application in !application.isTerminated })
      .flatMap({ application in
        NSAppleEventDescriptor(processIdentifier: application.processIdentifier).coerce(toDescriptorType: typeProcessSerialNumber)
      }) else {
      throw MusicIsClosed()
    }

    return process
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
