// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "MusicBridge",
  platforms: [.macOS("26.0")],
  targets: [
    .executableTarget(name: "MusicBridge", path: "Sources"),
    .testTarget(name: "MusicBridgeTests", dependencies: ["MusicBridge"], path: "Tests"),
  ],
  swiftLanguageModes: [.v5]
)
