import Foundation

struct AppleScriptFailure: Error {
  let number: Int
  let message: String

  static func from(_ someErrorInformation: NSDictionary?) -> AppleScriptFailure {
    AppleScriptFailure(
      number: someErrorInformation?[NSAppleScript.errorNumber] as? Int ?? 0,
      message: someErrorInformation?[NSAppleScript.errorMessage] as? String ?? "Unknown AppleScript failure"
    )
  }

  var isPermissionDenial: Bool {
    number == -1743
  }
}

protocol AppleScriptHandlers {
  func call(_ aHandlerName: String, with someArguments: [NSAppleEventDescriptor]) throws -> NSAppleEventDescriptor
}

final class AppleScriptLibrary: AppleScriptHandlers {
  private let script: NSAppleScript

  private init(script aScript: NSAppleScript) {
    self.script = aScript
  }

  static func compiled(from aSource: String) throws -> AppleScriptLibrary {
    let script = NSAppleScript(source: aSource)!
    var errorInformation: NSDictionary?

    guard script.compileAndReturnError(&errorInformation) else {
      throw AppleScriptFailure.from(errorInformation)
    }

    return AppleScriptLibrary(script: script)
  }

  func call(_ aHandlerName: String, with someArguments: [NSAppleEventDescriptor]) throws -> NSAppleEventDescriptor {
    var errorInformation: NSDictionary?
    let result = script.executeAppleEvent(subroutineEvent(calling: aHandlerName, with: someArguments), error: &errorInformation)

    guard errorInformation == nil else {
      throw AppleScriptFailure.from(errorInformation)
    }

    return result
  }

  private func subroutineEvent(calling aHandlerName: String, with someArguments: [NSAppleEventDescriptor]) -> NSAppleEventDescriptor {
    let event = NSAppleEventDescriptor(
      eventClass: fourCharacterCode("ascr"),
      eventID: fourCharacterCode("psbr"),
      targetDescriptor: NSAppleEventDescriptor.currentProcess(),
      returnID: AEReturnID(-1),
      transactionID: AETransactionID(0)
    )
    let parameters = NSAppleEventDescriptor.list()
    someArguments.enumerated().forEach { position, argument in
      parameters.insert(argument, at: position + 1)
    }
    // Apple Events identify AppleScript handlers by their lowercased name.
    event.setParam(NSAppleEventDescriptor(string: aHandlerName.lowercased()), forKeyword: fourCharacterCode("snam"))
    event.setParam(parameters, forKeyword: fourCharacterCode("----"))

    return event
  }

  private func fourCharacterCode(_ aCode: String) -> FourCharCode {
    aCode.utf8.reduce(0) { accumulated, character in
      (accumulated << 8) | FourCharCode(character)
    }
  }
}
