import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'trendlab-super-secret-key-2024-bcmos'
)

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json()

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Identifier and password required' }, { status: 400 })
    }

    const db = getDb()

    // Find user by identifier
    const snapshot = await getDocs(
      query(collection(db, 'users'), where('identifier', '==', identifier.trim().toLowerCase()))
    )

    if (snapshot.empty) {
      // Generic error to avoid user enumeration
      return NextResponse.json({ error: 'Invalid identifier or password' }, { status: 401 })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    // Compare password
    const isValid = await bcrypt.compare(password, userData.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid identifier or password' }, { status: 401 })
    }

    // Fetch channel data
    let channel = null
    try {
      const channelDoc = await getDoc(doc(db, 'channels', userData.channelId))
      if (channelDoc.exists()) {
        channel = { id: channelDoc.id, ...channelDoc.data() }
      }
    } catch { /* ignore */ }

    // Issue JWT
    const token = await new SignJWT({
      userId: userDoc.id,
      identifier: userData.identifier,
      channelId: userData.channelId,
      type: userData.type,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

    const response = NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        identifier: userData.identifier,
        type: userData.type,
        channelId: userData.channelId,
        channel,
      },
    })

    response.cookies.set('trendlab_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
