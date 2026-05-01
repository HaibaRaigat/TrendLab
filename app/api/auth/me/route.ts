import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getDb } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'trendlab-super-secret-key-2024-bcmos'
)

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('trendlab_session')?.value
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const { userId, identifier, channelId, type } = payload as {
      userId: string
      identifier: string
      channelId: string
      type: string
    }

    // Fetch channel data
    let channel = null
    try {
      const db = getDb()
      const channelDoc = await getDoc(doc(db, 'channels', channelId))
      if (channelDoc.exists()) {
        channel = { id: channelDoc.id, ...channelDoc.data() }
      }
    } catch { /* ignore */ }

    return NextResponse.json({
      user: { id: userId, identifier, type, channelId, channel },
    })
  } catch {
    // Token expired or invalid
    const response = NextResponse.json({ user: null }, { status: 401 })
    response.cookies.set('trendlab_session', '', { maxAge: 0, path: '/' })
    return response
  }
}
