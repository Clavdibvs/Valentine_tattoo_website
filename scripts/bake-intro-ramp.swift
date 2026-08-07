// Bakes the opening clip's speed ramp into the file itself.
//
//   swift scripts/bake-intro-ramp.swift <in.mp4> <out.mp4> <startAt> [fps]
//
// ## Why this exists
//
// The ramp used to be applied at runtime with `video.playbackRate`. It worked,
// but it asked the impossible on a phone: the master runs at 24 fps, so at the
// ramp's peak of ~2.9x the browser has to present about 70 frames a second on a
// 60 Hz display. It cannot, so it drops roughly one frame in seven — and it
// drops them on an irregular cadence. That irregularity is what reads as
// stutter. The bitrate and the codec were never the problem.
//
// Baking removes the question. The output carries the ramp in its own
// timestamps, at a constant frame rate the display can actually show, so the
// page plays it at 1x and every frame lands on a refresh.
//
// The audio track is dropped: the clip is muted on the page, so it was bytes
// nobody hears — and on iOS a rate change drags the audio clock into a resync
// that shows up as a visible hitch.
//
// ## The ramp
//
// Canonically stated in `src/lib/intro-timing.ts`; restated here because this
// is the only place that still applies it.
//
//   rate(v) = sqrt(16 - 3v)   for v < 5, then 1
//
// which is the linear fall from 4x to 1x over the clip's first five seconds,
// expressed against clip position. Integrating it gives the output time of any
// clip position:
//
//   t(v) = (8 - 2*sqrt(16 - 3v)) / 3
//
// so clip second 5 arrives at output second 2, and the rest runs untouched.
// The ramp is applied as a chain of short constant-rate slices; at fifty of
// them the steps are far below anything the eye resolves.

import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count >= 4 else {
    FileHandle.standardError.write("usage: bake-intro-ramp <in> <out> <startAt> [fps]\n".data(using: .utf8)!)
    exit(2)
}
let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
let startAt = Double(args[3]) ?? 0
let fps = args.count > 4 ? Int32(args[4]) ?? 60 : 60

let RAMP_UNTIL = 5.0
let SLICES = 50
let TS: Int32 = 90_000

/// Output time at which clip position `v` arrives.
func outputTime(_ v: Double) -> Double {
    let clamped = min(v, RAMP_UNTIL)
    let ramped = (8 - 2 * (16 - 3 * clamped).squareRoot()) / 3
    return v <= RAMP_UNTIL ? ramped : ramped + (v - RAMP_UNTIL)
}

/// Its inverse: the clip position showing at output time `t`.
func clipPosition(_ t: Double) -> Double {
    let rampDuration = outputTime(RAMP_UNTIL)          // 2 seconds, by construction
    if t >= rampDuration { return RAMP_UNTIL + (t - rampDuration) }
    let root = (8 - 3 * t) / 2
    return (16 - root * root) / 3
}

let asset = AVURLAsset(url: inputURL)
guard let source = asset.tracks(withMediaType: .video).first else {
    FileHandle.standardError.write("no video track\n".data(using: .utf8)!)
    exit(1)
}
let sourceDuration = CMTimeGetSeconds(asset.duration)

// The composition does the *spatial* work only — trim and scale. The temporal
// warp is applied below, frame by frame.
//
// It cannot be delegated to `scaleTimeRange`: AVFoundation passes a composition
// whose instructions are passthrough straight through, ignoring the video
// composition's `frameDuration`, so both AVAssetExportSession and
// AVAssetReaderVideoCompositionOutput hand back frames on the source's own
// 24 fps cadence. Stamping those onto a 60 fps grid does not resample them, it
// just plays them faster — the first attempt came out at 1.78s instead of 3.28s.
// Resampling explicitly is the only way to actually get a constant frame rate.
let composition = AVMutableComposition()
guard let track = composition.addMutableTrack(
    withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid
) else { exit(1) }
track.preferredTransform = source.preferredTransform
try track.insertTimeRange(
    CMTimeRange(start: CMTime(seconds: startAt, preferredTimescale: TS),
                end: CMTime(seconds: sourceDuration, preferredTimescale: TS)),
    of: source, at: .zero
)

let outputDuration = outputTime(sourceDuration) - outputTime(startAt)

// Spatial only: the master is 4K, and the page never shows it larger than the
// backdrop plate it resolves into.
//
// Exactly 1080x1920 rather than a scale that preserves the master's ratio —
// that rounded to 1082x1920, and since the page stretches the video to fit
// (`object-fit: fill`, matching the plate) an odd width would be a slight,
// permanent horizontal squeeze against the image it has to register with.
let oriented = source.naturalSize.applying(source.preferredTransform)
let sourceSize = CGSize(width: abs(oriented.width), height: abs(oriented.height))
let portrait = sourceSize.height >= sourceSize.width
let outSize = portrait ? CGSize(width: 1080, height: 1920) : CGSize(width: 1920, height: 1080)

// The scale has to be stated as a layer transform. Setting `renderSize` alone
// does not resize anything — it resizes the *canvas*, and the 4K frame is then
// drawn into it at full size, so all that survives is one corner. On this
// artwork that corner is black, which is exactly how it came out: a last frame
// with a luminance of 0.44 against the master's 3.96.
let videoComposition = AVMutableVideoComposition()
videoComposition.renderSize = outSize
videoComposition.frameDuration = CMTime(value: 1, timescale: 24)

let instruction = AVMutableVideoCompositionInstruction()
instruction.timeRange = CMTimeRange(start: .zero, duration: composition.duration)
let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
layer.setTransform(
    source.preferredTransform.concatenating(CGAffineTransform(
        scaleX: outSize.width / sourceSize.width,
        y: outSize.height / sourceSize.height
    )),
    at: .zero
)
instruction.layerInstructions = [layer]
videoComposition.instructions = [instruction]

guard let reader = try? AVAssetReader(asset: composition) else { exit(1) }
let readerOutput = AVAssetReaderVideoCompositionOutput(
    videoTracks: composition.tracks(withMediaType: .video),
    videoSettings: [kCVPixelBufferPixelFormatTypeKey as String:
                        kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange]
)
readerOutput.videoComposition = videoComposition
readerOutput.alwaysCopiesSampleData = false
reader.add(readerOutput)

try? FileManager.default.removeItem(at: outputURL)
guard let writer = try? AVAssetWriter(outputURL: outputURL, fileType: .mp4) else { exit(1) }

// Bitrate scaled to the pixel count, at roughly the master's density.
let bitrate = Int(outSize.width * outSize.height * Double(fps) * 0.07)
let writerInput = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: Int(outSize.width),
    AVVideoHeightKey: Int(outSize.height),
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: bitrate,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: Int(fps),
        // No B-frames. They would save a little size, but they cost the decoder
        // a reordering buffer and the extra latency that comes with it — the
        // wrong trade for a clip whose whole purpose is to play without a hitch
        // on a phone.
        AVVideoAllowFrameReorderingKey: false,
        AVVideoExpectedSourceFrameRateKey: Int(fps),
    ],
])
writerInput.expectsMediaDataInRealTime = false
writer.add(writerInput)
writer.shouldOptimizeForNetworkUse = true   // moov atom first: playback starts on the first bytes

guard reader.startReading(), writer.startWriting() else {
    FileHandle.standardError.write("could not start: \(reader.error?.localizedDescription ?? "")\n".data(using: .utf8)!)
    exit(1)
}
writer.startSession(atSourceTime: .zero)

/*
 * The resample.
 *
 * One pass, streaming. For each slot on the output grid the clip position it
 * should be showing is computed from the inverse ramp; the reader is advanced
 * until it holds the newest source frame at or before that position, and that
 * frame is written with the slot's timestamp.
 *
 * Both timelines run forwards, so the source is never rewound and only one
 * frame is ever held. Where the ramp is fast several source frames are stepped
 * over between slots; where it is slow the same frame is written to more than
 * one slot. Either way every slot is filled, which is what makes the output a
 * genuine constant frame rate rather than source frames with new labels.
 */
let totalFrames = Int((outputDuration * Double(fps)).rounded())
var written = 0
var current: CMSampleBuffer? = readerOutput.copyNextSampleBuffer()
var pending: CMSampleBuffer? = readerOutput.copyNextSampleBuffer()

let queue = DispatchQueue(label: "bake")
let done = DispatchSemaphore(value: 0)
writerInput.requestMediaDataWhenReady(on: queue) {
    while writerInput.isReadyForMoreMediaData {
        guard written < totalFrames, let frame = current else {
            writerInput.markAsFinished()
            writer.finishWriting { done.signal() }
            return
        }

        // Composition time is clip position measured from the trim point.
        let wanted = clipPosition(Double(written) / Double(fps) + outputTime(startAt)) - startAt

        while let next = pending,
              CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(next)) <= wanted {
            current = next
            pending = readerOutput.copyNextSampleBuffer()
        }

        var timing = CMSampleTimingInfo(
            duration: CMTime(value: 1, timescale: fps),
            presentationTimeStamp: CMTime(value: CMTimeValue(written), timescale: fps),
            decodeTimeStamp: .invalid
        )
        var retimed: CMSampleBuffer?
        CMSampleBufferCreateCopyWithNewTiming(
            allocator: kCFAllocatorDefault, sampleBuffer: current ?? frame,
            sampleTimingEntryCount: 1, sampleTimingArray: &timing, sampleBufferOut: &retimed
        )
        if let retimed { writerInput.append(retimed) }
        written += 1
    }
}
done.wait()

if writer.status != .completed {
    FileHandle.standardError.write("write failed: \(writer.error?.localizedDescription ?? "unknown")\n".data(using: .utf8)!)
    exit(1)
}

let outDuration = CMTimeGetSeconds(AVURLAsset(url: outputURL).duration)
print(String(format: "%.4f %d", outDuration, written))
