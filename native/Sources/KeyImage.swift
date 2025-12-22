import AppKit

struct KeyImage {
  private static let side = 144

  let dataURI: String

  func describeAsArtwork(_ aDescription: [String: Any]) -> [String: Any] {
    aDescription.merging(["artwork": dataURI]) { _, artwork in artwork }
  }

  static func cover(from someArtworkData: Data) -> KeyImage? {
    guard let artwork = NSImage(data: someArtworkData) else {
      return nil
    }

    return drawn { canvas in
      draw(artwork, in: canvas)
    }
  }

  static func mosaic(from someArtworksData: [Data]) -> KeyImage? {
    let artworks = someArtworksData.compactMap { NSImage(data: $0) }

    guard artworks.count >= 4 else {
      return artworks.first.flatMap { artwork in
        drawn { canvas in
          draw(artwork, in: canvas)
        }
      }
    }

    return drawn { canvas in
      let half = canvas.width / 2
      let quadrants = [
        NSRect(x: 0, y: half, width: half, height: half),
        NSRect(x: half, y: half, width: half, height: half),
        NSRect(x: 0, y: 0, width: half, height: half),
        NSRect(x: half, y: 0, width: half, height: half),
      ]
      zip(artworks, quadrants).forEach { artwork, quadrant in
        draw(artwork, in: quadrant)
      }
    }
  }

  private static func drawn(_ aDrawing: (NSRect) -> Void) -> KeyImage? {
    guard let bitmap = NSBitmapImageRep(
      bitmapDataPlanes: nil,
      pixelsWide: side,
      pixelsHigh: side,
      bitsPerSample: 8,
      samplesPerPixel: 4,
      hasAlpha: true,
      isPlanar: false,
      colorSpaceName: .deviceRGB,
      bytesPerRow: 0,
      bitsPerPixel: 0
    ) else {
      return nil
    }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    NSGraphicsContext.current?.imageInterpolation = .high
    aDrawing(NSRect(x: 0, y: 0, width: side, height: side))
    NSGraphicsContext.restoreGraphicsState()

    return bitmap
      .representation(using: .png, properties: [:])
      .map { png in
        KeyImage(dataURI: "data:image/png;base64,\(png.base64EncodedString())")
      }
  }

  private static func draw(_ anArtwork: NSImage, in anArea: NSRect) {
    let scale = max(anArea.width / anArtwork.size.width, anArea.height / anArtwork.size.height)
    let croppedSize = NSSize(width: anArea.width / scale, height: anArea.height / scale)
    let croppedRegion = NSRect(
      x: (anArtwork.size.width - croppedSize.width) / 2,
      y: (anArtwork.size.height - croppedSize.height) / 2,
      width: croppedSize.width,
      height: croppedSize.height
    )
    anArtwork.draw(in: anArea, from: croppedRegion, operation: .copy, fraction: 1)
  }
}
