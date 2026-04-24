import AppKit
import AVFoundation
import CoreVideo
import Foundation

let args = CommandLine.arguments
guard args.count >= 4 else {
  fputs("Usage: images-to-video.swift output.mp4 seconds-per-image image1 image2 ...\n", stderr)
  exit(1)
}

let outputURL = URL(fileURLWithPath: args[1])
let secondsPerImage = Double(args[2]) ?? 2.0
let imagePaths = Array(args.dropFirst(3))
let width = 720
let height = 1280
let fps = 30

try? FileManager.default.removeItem(at: outputURL)

guard let writer = try? AVAssetWriter(outputURL: outputURL, fileType: .mp4) else {
  fputs("Failed to create AVAssetWriter\n", stderr)
  exit(1)
}

let settings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: width,
  AVVideoHeightKey: height
]

let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false

let attributes: [String: Any] = [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
  kCVPixelBufferWidthKey as String: width,
  kCVPixelBufferHeightKey as String: height
]

let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: attributes)

guard writer.canAdd(input) else {
  fputs("Cannot add writer input\n", stderr)
  exit(1)
}
writer.add(input)

func makePixelBuffer(from path: String) -> CVPixelBuffer? {
  guard let image = NSImage(contentsOfFile: path) else {
    fputs("Cannot read image: \(path)\n", stderr)
    return nil
  }

  var pixelBuffer: CVPixelBuffer?
  let status = CVPixelBufferCreate(
    kCFAllocatorDefault,
    width,
    height,
    kCVPixelFormatType_32ARGB,
    [
      kCVPixelBufferCGImageCompatibilityKey: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey: true
    ] as CFDictionary,
    &pixelBuffer
  )

  guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
    fputs("Cannot create pixel buffer\n", stderr)
    return nil
  }

  CVPixelBufferLockBaseAddress(buffer, [])
  defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

  guard
    let data = CVPixelBufferGetBaseAddress(buffer),
    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
    let context = CGContext(
      data: data,
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
      space: colorSpace,
      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
    )
  else {
    fputs("Cannot create CGContext\n", stderr)
    return nil
  }

  context.setFillColor(NSColor.black.cgColor)
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))

  let imageSize = image.size
  let scale = max(Double(width) / imageSize.width, Double(height) / imageSize.height)
  let drawWidth = imageSize.width * scale
  let drawHeight = imageSize.height * scale
  let drawRect = NSRect(
    x: (Double(width) - drawWidth) / 2.0,
    y: (Double(height) - drawHeight) / 2.0,
    width: drawWidth,
    height: drawHeight
  )

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
  image.draw(in: drawRect, from: .zero, operation: .copy, fraction: 1.0)
  NSGraphicsContext.restoreGraphicsState()

  return buffer
}

writer.startWriting()
writer.startSession(atSourceTime: .zero)

let frameDuration = CMTime(value: 1, timescale: CMTimeScale(fps))
let framesPerImage = max(1, Int(secondsPerImage * Double(fps)))
var frameIndex: Int64 = 0

for path in imagePaths {
  guard let buffer = makePixelBuffer(from: path) else {
    writer.cancelWriting()
    exit(1)
  }

  for _ in 0..<framesPerImage {
    while !input.isReadyForMoreMediaData {
      Thread.sleep(forTimeInterval: 0.01)
    }
    let time = CMTimeMultiply(frameDuration, multiplier: Int32(frameIndex))
    if !adaptor.append(buffer, withPresentationTime: time) {
      fputs("Failed to append frame for \(path)\n", stderr)
      writer.cancelWriting()
      exit(1)
    }
    frameIndex += 1
  }
}

input.markAsFinished()
let semaphore = DispatchSemaphore(value: 0)
writer.finishWriting {
  semaphore.signal()
}
semaphore.wait()

if writer.status != .completed {
  fputs("Video writer failed: \(writer.error?.localizedDescription ?? "unknown error")\n", stderr)
  exit(1)
}

print(outputURL.path)
