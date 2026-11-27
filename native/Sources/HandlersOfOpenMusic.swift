import Foundation

struct MusicIsClosed: Error {
}

// Asking a closed Music to run a handler would launch it, so it's only asked while it's running, and through its
// process: Music may quit between two Apple Events of a handler, and the next one would launch it if it were addressed
// by its bundle identifier.
final class HandlersOfOpenMusic: AppleScriptHandlers {
  private let script: MusicScript
  private let application: MusicApplication

  init(script aScript: MusicScript, application anApplication: MusicApplication) {
    self.script = aScript
    self.application = anApplication
  }

  func call(_ aHandlerName: String, with someArguments: [NSAppleEventDescriptor]) throws -> NSAppleEventDescriptor {
    try script.call(aHandlerName, on: try application.runningProcess(), with: someArguments)
  }
}
