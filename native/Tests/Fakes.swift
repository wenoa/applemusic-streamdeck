import AppKit
@testable import MusicBridge

final class FakeMusicScript: AppleScriptHandlers {
  private var replies: [String: NSAppleEventDescriptor] = [:]
  private var failures: [String: AppleScriptFailure] = [:]
  private var calls: [(handler: String, arguments: [NSAppleEventDescriptor])] = []

  func replying(to handlerName: String, with reply: NSAppleEventDescriptor) -> FakeMusicScript {
    replies[handlerName] = reply

    return self
  }

  func failing(_ handlerName: String, with failure: AppleScriptFailure) -> FakeMusicScript {
    failures[handlerName] = failure

    return self
  }

  func call(_ handlerName: String, with arguments: [NSAppleEventDescriptor]) throws -> NSAppleEventDescriptor {
    calls.append((handler: handlerName, arguments: arguments))

    if let failure = failures[handlerName] {
      throw failure
    }

    return replies[handlerName] ?? NSAppleEventDescriptor.null()
  }

  func callsTo(_ handlerName: String) -> Int {
    calls.filter { call in call.handler == handlerName }.count
  }

  func handlersCalled() -> [String] {
    calls.map { call in call.handler }
  }

  func argumentsOfLastCall(to handlerName: String) -> [NSAppleEventDescriptor] {
    calls.last { call in call.handler == handlerName }?.arguments ?? []
  }
}

final class FakeMusicApplication: MusicApplication {
  var isRunning: Bool
  private(set) var openings = 0
  private(set) var automationPermissionRevelations = 0

  init(isRunning: Bool) {
    self.isRunning = isRunning
  }

  func open() {
    openings += 1
  }

  func revealAutomationPermission() {
    automationPermissionRevelations += 1
  }
}

final class FakePlugin: PluginConnection {
  private(set) var sentEvents: [String] = []
  private(set) var logs: [String] = []

  func send(_ serializedEvent: String) {
    sentEvents.append(serializedEvent)
  }

  func log(_ message: String) {
    logs.append(message)
  }

  func events() -> [NSDictionary] {
    sentEvents.compactMap { event in
      (try? JSONSerialization.jsonObject(with: Data(event.utf8))) as? NSDictionary
    }
  }

  func lastEvent() -> NSDictionary {
    events().last ?? [:]
  }
}

enum Descriptors {
  static func list(_ items: [NSAppleEventDescriptor]) -> NSAppleEventDescriptor {
    let list = NSAppleEventDescriptor.list()
    items.enumerated().forEach { position, item in
      list.insert(item, at: position + 1)
    }

    return list
  }

  static func text(_ text: String) -> NSAppleEventDescriptor {
    NSAppleEventDescriptor(string: text)
  }

  static func boolean(_ boolean: Bool) -> NSAppleEventDescriptor {
    NSAppleEventDescriptor(boolean: boolean)
  }

  static func data(_ data: Data) -> NSAppleEventDescriptor {
    NSAppleEventDescriptor(descriptorType: 0x7464_7461, data: data)!
  }

  static func snapshot(_ state: String, track: String, favorited: Bool, artist: String, album: String) -> NSAppleEventDescriptor {
    list([text(state), text(track), boolean(favorited), text(artist), text(album)])
  }

  static func artwork(of track: String, _ artwork: Data) -> NSAppleEventDescriptor {
    list([text(track), data(artwork)])
  }
}

enum Artworks {
  static func png(red: CGFloat) -> Data {
    let bitmap = NSBitmapImageRep(
      bitmapDataPlanes: nil,
      pixelsWide: 4,
      pixelsHigh: 4,
      bitsPerSample: 8,
      samplesPerPixel: 4,
      hasAlpha: true,
      isPlanar: false,
      colorSpaceName: .deviceRGB,
      bytesPerRow: 0,
      bitsPerPixel: 0
    )!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    NSColor(deviceRed: red, green: 0, blue: 1 - red, alpha: 1).setFill()
    NSRect(x: 0, y: 0, width: 4, height: 4).fill()
    NSGraphicsContext.restoreGraphicsState()

    return bitmap.representation(using: .png, properties: [:])!
  }

  static let notAnImage = Data("not an image".utf8)
}
