import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Simple in-memory rate limiter: max 10 likes per user per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'trendlab-super-secret-key-2024-bcmos'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json({ success: false, message: 'Missing videoId' }, { status: 400 })
    }

    // Verify session — user must be logged in
    const token = request.cookies.get('trendlab_session')?.value
    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    let userId: string
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      userId = payload.userId as string
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 })
    }

    // Rate limit: max 10 likes per user per 60 seconds
    const key = `${userId}-like`
    const now = Date.now()
    const limit = rateLimitMap.get(key)

    if (limit && now < limit.resetAt && limit.count >= 10) {
      return NextResponse.json({ success: false, message: 'Too many likes, slow down' }, { status: 429 })
    }

    if (!limit || now > limit.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + 60000 })
    } else {
      rateLimitMap.set(key, { count: limit.count + 1, resetAt: limit.resetAt })
    }

    // Cleanup old entries periodically
    if (rateLimitMap.size > 5000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (now > v.resetAt) rateLimitMap.delete(k)
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
