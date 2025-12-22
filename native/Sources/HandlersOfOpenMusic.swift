import Foundation

struct MusicIsClosed: Error {
}

// Asking a closed Music to run a handler would launch it, so it's only asked while it's running.
final class HandlersOfOpenMusic: AppleScriptHandlers {
  private let handlers: AppleScriptHandlers
  private let application: MusicApplication

  init(handlers someHandlers: AppleScriptHandlers, application anApplication: MusicApplication) {
    self.handlers = someHandlers
    self.application = anApplication
  }

  func call(_ aHandlerName: String, with someArguments: [NSAppleEventDescriptor]) throws -> NSAppleEventDescriptor {
    guard application.isRunning else {
      throw MusicIsClosed()
    }

    return try handlers.call(aHandlerName, with: someArguments)
  }
}
