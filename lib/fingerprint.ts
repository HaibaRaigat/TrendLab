let fingerprintPromise: Promise<string> | null = null

export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return 'server'

  if (fingerprintPromise) return fingerprintPromise

  fingerprintPromise = (async () => {
    try {
      const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      return result.visitorId
    } catch {
      // Fallback: generate a stable ID from browser properties
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx?.fillText('fingerprint', 10, 10)
      
      const fallbackData = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
      ].join('|')
      
      return await hashString(fallbackData)
    }
  })()

  return fingerprintPromise
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function getLikedVideos(): Set<string> {
  try {
    const stored = localStorage.getItem('trendlab_liked')
    if (!stored) return new Set()
    return new Set(JSON.parse(stored))
  } catch {
    return new Set()
  }
}

export function saveLikedVideo(videoId: string): void {
  try {
    const liked = getLikedVideos()
    liked.add(videoId)
    localStorage.setItem('trendlab_liked', JSON.stringify(Array.from(liked)))
  } catch {
    // localStorage not available
  }
}

export function hasLikedVideo(videoId: string): boolean {
  return getLikedVideos().has(videoId)
}
