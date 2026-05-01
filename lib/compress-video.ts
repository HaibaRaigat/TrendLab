/**
 * Compresses a video file in the browser using MediaRecorder API.
 * No external libraries required — uses native browser APIs.
 */
export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  savedPercent: number
}

/**
 * Detects the best supported MIME type for compression.
 */
function getBestMimeType(): string {
  const types = [
    'video/mp4;codecs=avc1',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return 'video/webm'
}

/**
 * Compresses a video file to reduce its size as much as possible.
 * Uses low bitrate encoding via MediaRecorder.
 *
 * @param file        Original video File
 * @param onProgress  Progress callback (0–100)
 */
export async function compressVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      const duration = video.duration
      const mimeType = getBestMimeType()

      // Determine target bitrate based on duration and original size
      // Goal: aim for ~1 MB/min minimum quality
      const originalBitsPerSec = (file.size * 8) / duration
      // Target: max 1.2 Mbps video + 64kbps audio, or 30% of original — whichever is lower
      const targetVideoBitrate = Math.min(
        1_200_000,
        Math.floor(originalBitsPerSec * 0.30)
      )
      // Never go below 300kbps (quality floor)
      const videoBitsPerSecond = Math.max(300_000, targetVideoBitrate)
      const audioBitsPerSecond = 64_000

      let stream: MediaStream
      try {
        stream = (video as any).captureStream()
      } catch {
        // Safari fallback — use mozCaptureStream
        try {
          stream = (video as any).mozCaptureStream()
        } catch (e) {
          URL.revokeObjectURL(url)
          reject(new Error('captureStream not supported in this browser'))
          return
        }
      }

      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond,
        audioBitsPerSecond,
      }

      const chunks: Blob[] = []
      let recorder: MediaRecorder

      try {
        recorder = new MediaRecorder(stream, options)
      } catch {
        // Fallback without specifying mimeType
        recorder = new MediaRecorder(stream, {
          videoBitsPerSecond,
          audioBitsPerSecond,
        })
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        URL.revokeObjectURL(url)
        stream.getTracks().forEach(t => t.stop())

        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType })
        const ext = recorder.mimeType?.includes('mp4') ? 'mp4' : 'webm'
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, `.${ext}`),
          { type: blob.type }
        )

        const savedPercent = Math.round(
          ((file.size - compressedFile.size) / file.size) * 100
        )

        resolve({
          file: compressedFile,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          savedPercent: Math.max(0, savedPercent),
        })
      }

      recorder.onerror = (e) => {
        URL.revokeObjectURL(url)
        reject(e)
      }

      // Track compression progress via video playback time
      video.ontimeupdate = () => {
        if (duration > 0 && onProgress) {
          const pct = Math.min(99, Math.round((video.currentTime / duration) * 100))
          onProgress(pct)
        }
      }

      video.onended = () => {
        onProgress?.(100)
        // Give MediaRecorder a moment to flush
        setTimeout(() => recorder.stop(), 200)
      }

      recorder.start(250)

      video.play().catch((err) => {
        URL.revokeObjectURL(url)
        reject(err)
      })
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video'))
    }
  })
}

/** Format bytes to human-readable string */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
