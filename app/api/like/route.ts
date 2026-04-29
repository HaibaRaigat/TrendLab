import { NextRequest, NextResponse } from 'next/server'

// This API validates like requests server-side
// The actual Firestore update happens client-side using Firebase SDK
// This endpoint provides additional server-side rate limiting

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(request: NextRequest, videoId: string): string {
  const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown'
  return `${ip}-${videoId}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, fingerprint, action } = body

    if (!videoId || !fingerprint) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    const key = getRateLimitKey(request, videoId)
    const now = Date.now()
    const limit = rateLimitMap.get(key)

    if (limit && now < limit.resetAt && limit.count >= 3) {
      return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!limit || now > limit.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + 60000 })
    } else {
      rateLimitMap.set(key, { count: limit.count + 1, resetAt: limit.resetAt })
    }

    // Cleanup old entries
    if (rateLimitMap.size > 10000) {
      const entries = Array.from(rateLimitMap.entries())
      for (const [k, v] of entries) {
        if (now > v.resetAt) rateLimitMap.delete(k)
      }
    }

    return NextResponse.json({ success: true, validated: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
