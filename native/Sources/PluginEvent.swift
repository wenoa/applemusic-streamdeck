import Foundation

protocol PluginEvent {
  func event() -> [String: Any]
}

extension PluginEvent {
  func serialized() -> String {
    let data = (try? JSONSerialization.data(withJSONObject: event(), options: [.sortedKeys])) ?? Data()

    return String(decoding: data, as: UTF8.self)
  }
}
