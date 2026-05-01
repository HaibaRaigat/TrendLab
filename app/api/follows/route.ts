import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getDb } from '@/lib/firebase'
import {
  collection, addDoc, getDocs, query, where,
  deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'trendlab-super-secret-key-2024-bcmos'
)

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get('trendlab_session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; channelId: string }
  } catch {
    return null
  }
}

// GET /api/follows?targetUserId=xxx - get follow counts for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get('targetUserId')
  const currentUserId = searchParams.get('currentUserId')

  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })
  }

  try {
    const db = getDb()

    const [followersSnap, followingSnap] = await Promise.all([
      getDocs(query(collection(db, 'follows'), where('followingId', '==', targetUserId))),
      getDocs(query(collection(db, 'follows'), where('followerId', '==', targetUserId))),
    ])

    let isFollowing = false
    if (currentUserId) {
      const checkSnap = await getDocs(
        query(
          collection(db, 'follows'),
          where('followerId', '==', currentUserId),
          where('followingId', '==', targetUserId)
        )
      )
      isFollowing = !checkSnap.empty
    }

    return NextResponse.json({
      followers: followersSnap.size,
      following: followingSnap.size,
      isFollowing,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 })
  }
}

// POST /api/follows - follow a user
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { targetUserId } = await request.json()
  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })
  }

  if (authUser.userId === targetUserId) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  try {
    const db = getDb()

    // Check if already following
    const existing = await getDocs(
      query(
        collection(db, 'follows'),
        where('followerId', '==', authUser.userId),
        where('followingId', '==', targetUserId)
      )
    )

    if (!existing.empty) {
      return NextResponse.json({ error: 'Already following' }, { status: 409 })
    }

    await addDoc(collection(db, 'follows'), {
      followerId: authUser.userId,
      followingId: targetUserId,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 })
  }
}

// DELETE /api/follows - unfollow a user
export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { targetUserId } = await request.json()

  try {
    const db = getDb()
    const existing = await getDocs(
      query(
        collection(db, 'follows'),
        where('followerId', '==', authUser.userId),
        where('followingId', '==', targetUserId)
      )
    )

    for (const followDoc of existing.docs) {
      await deleteDoc(doc(db, 'follows', followDoc.id))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 })
  }
}
