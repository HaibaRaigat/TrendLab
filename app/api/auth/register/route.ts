import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { getDb } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'trendlab-super-secret-key-2024-bcmos'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password, channelName, channelType, members, profileImageURL } = body

    if (!identifier || !password || !channelName || !channelType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (identifier.trim().length < 3) {
      return NextResponse.json({ error: 'Identifier must be at least 3 characters' }, { status: 400 })
    }

    if (password.length < 1) {
      return NextResponse.json({ error: 'Password cannot be empty' }, { status: 400 })
    }

    const db = getDb()

    // Check if identifier already taken
    const existing = await getDocs(
      query(collection(db, 'users'), where('identifier', '==', identifier.trim().toLowerCase()))
    )
    if (!existing.empty) {
      return NextResponse.json({ error: 'This identifier is already taken' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create channel in Firestore
    const channelDoc = await addDoc(collection(db, 'channels'), {
      name: channelName.trim(),
      profileImageURL: profileImageURL || '',
      members: channelType === 'individual'
        ? (members.length > 0 ? [members[0]] : [channelName.trim()])
        : members,
      type: channelType,
      createdAt: serverTimestamp(),
    })

    // Create user in Firestore
    const userDoc = await addDoc(collection(db, 'users'), {
      identifier: identifier.trim().toLowerCase(),
      passwordHash,
      type: channelType,
      channelId: channelDoc.id,
      createdAt: serverTimestamp(),
    })

    // Issue JWT session token
    const token = await new SignJWT({
      userId: userDoc.id,
      identifier: identifier.trim().toLowerCase(),
      channelId: channelDoc.id,
      type: channelType,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

    const response = NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        identifier: identifier.trim().toLowerCase(),
        type: channelType,
        channelId: channelDoc.id,
      },
    })

    response.cookies.set('trendlab_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
