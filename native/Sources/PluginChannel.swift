import Foundation

protocol PluginConnection {
  func send(_ aSerializedEvent: String)

  func log(_ aMessage: String)
}

extension PluginConnection {
  func report(_ anEvent: PluginEvent) {
    send(anEvent.serialized())
  }
}

final class PluginChannel: PluginConnection {
  private var incompleteLine = ""

  func send(_ aSerializedEvent: String) {
    FileHandle.standardOutput.write(Data("\(aSerializedEvent)\n".utf8))
  }

  func log(_ aMessage: String) {
    FileHandle.standardError.write(Data("\(aMessage)\n".utf8))
  }

  func listen(_ aReceiver: @escaping ([String: Any]) -> Void) {
    FileHandle.standardInput.readabilityHandler = { input in
      let data = input.availableData

      // The plugin closed our input: it is gone, and so are we.
      guard !data.isEmpty else {
        exit(0)
      }

      DispatchQueue.main.async {
        self.completeLines(with: String(decoding: data, as: UTF8.self)).forEach { line in
          self.parsed(line).map(aReceiver)
        }
      }
    }
  }

  private func completeLines(with aChunk: String) -> [String] {
    var lines = (incompleteLine + aChunk).components(separatedBy: "\n")
    incompleteLine = lines.removeLast()

    return lines.filter { line in !line.trimmingCharacters(in: .whitespaces).isEmpty }
  }

  private func parsed(_ aLine: String) -> [String: Any]? {
    guard let message = (try? JSONSerialization.jsonObject(with: Data(aLine.utf8))) as? [String: Any] else {
      log("Ignored malformed message: \(aLine)")
      return nil
    }

    return message
  }
}
