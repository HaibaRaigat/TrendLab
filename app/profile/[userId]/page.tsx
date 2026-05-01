'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, User, Play, Pause, Volume2, VolumeX,
  ChevronLeft, ChevronRight, X, Grid3X3, Loader2
} from 'lucide-react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { VideoWithChannel, Channel } from '@/types'
import { useAuth } from '@/lib/auth-context'
import FollowButton from '@/components/FollowButton'
import { timeAgo } from '@/lib/utils'
import Link from 'next/link'

interface ProfileUser {
  id: string
  identifier: string
  type: 'individual' | 'group'
  channelId: string
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const { user: authUser } = useAuth()

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [channel, setChannel] = useState<Channel | null>(null)
  const [videos, setVideos] = useState<VideoWithChannel[]>([])
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Reel viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const isOwnProfile = authUser?.id === userId

  const loadProfile = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    setError('')

    try {
      const db = getDb()

      // Fetch user data
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        setError('Profile not found')
        setIsLoading(false)
        return
      }
      const userData = { id: userDoc.id, ...userDoc.data() } as ProfileUser
      setProfileUser(userData)

      // Fetch channel
      const channelDoc = await getDoc(doc(db, 'channels', userData.channelId))
      if (channelDoc.exists()) {
        setChannel({ id: channelDoc.id, ...channelDoc.data() } as Channel)
      }

      // Fetch videos by this channel — sort client-side to avoid composite index
      const videosSnap = await getDocs(
        query(
          collection(db, 'videos'),
          where('channelId', '==', userData.channelId)
        )
      )
      const vids = videosSnap.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          channel: channelDoc.exists() ? { id: channelDoc.id, ...channelDoc.data() } as Channel : undefined,
        }))
        .sort((a: any, b: any) => {
          const aTime = a.timestamp?.seconds ?? 0
          const bTime = b.timestamp?.seconds ?? 0
          return bTime - aTime
        }) as VideoWithChannel[]
      setVideos(vids)

      // Fetch follow stats
      const res = await fetch(
        `/api/follows?targetUserId=${userId}&currentUserId=${authUser?.id || ''}`
      )
      if (res.ok) {
        const stats = await res.json()
        setFollowStats({ followers: stats.followers, following: stats.following })
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
      setError('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [userId, authUser?.id])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Video viewer controls
  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
    setIsPlaying(true)
    setIsMuted(false)
  }

  const closeViewer = () => {
    setViewerOpen(false)
    videoRef.current?.pause()
    setIsPlaying(false)
  }

  const goNext = () => {
    if (viewerIndex < videos.length - 1) {
      setViewerIndex(i => i + 1)
      setIsPlaying(true)
    }
  }

  const goPrev = () => {
    if (viewerIndex > 0) {
      setViewerIndex(i => i - 1)
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    if (!viewerOpen) return
    const vid = videoRef.current
    if (!vid) return
    vid.currentTime = 0
    vid.muted = isMuted
    if (isPlaying) {
      vid.play().catch(() => {
        vid.muted = true
        setIsMuted(true)
        vid.play().catch(() => {})
      })
    } else {
      vid.pause()
    }
  }, [viewerIndex, viewerOpen, isPlaying])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewerOpen) return
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') closeViewer()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewerOpen, viewerIndex, videos.length])

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary animate-spin" />
          <span className="text-white/40 text-sm">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error || !profileUser || !channel) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-white font-bold text-xl mb-2">Profile not found</h2>
          <p className="text-white/40 text-sm mb-6">{error || 'This profile does not exist'}</p>
          <button onClick={() => router.push('/')} className="btn-primary px-6 py-2.5 rounded-xl text-white font-medium text-sm">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface">
      {/* Top navigation */}
      <div className="sticky top-0 z-20 glass border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div>
          <p className="text-white font-semibold text-sm">{channel.name}</p>
          <p className="text-white/40 text-xs">{videos.length} reels</p>
        </div>
        {isOwnProfile && (
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
              window.location.href = '/login'
            }}
            className="ml-auto text-xs text-white/40 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
          >
            Sign out
          </button>
        )}
      </div>

      {/* Profile header — Instagram style */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-start gap-5">
          {/* Profile image */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden bg-surface-3">
              {channel.profileImageURL ? (
                <img src={channel.profileImageURL} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/20">
                  <span className="text-primary font-bold text-2xl">{channel.name[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-1 mb-1">
              <h1 className="text-white font-bold text-lg leading-tight">{channel.name}</h1>
            </div>
            <p className="text-white/40 text-xs mb-3">@{profileUser.identifier}</p>

            <div className="flex gap-5">
              <div className="text-center">
                <p className="text-white font-bold text-base">{videos.length}</p>
                <p className="text-white/40 text-[11px]">Reels</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base">{followStats.followers}</p>
                <p className="text-white/40 text-[11px]">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base">{followStats.following}</p>
                <p className="text-white/40 text-[11px]">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Type badge + members */}
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-medium ${
            channel.type === 'individual'
              ? 'bg-primary/10 border-primary/30 text-primary-light'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
            {channel.type === 'individual' ? <User size={11} /> : <Users size={11} />}
            {channel.type === 'individual' ? 'Individual' : 'Group'}
          </span>
          {channel.members.length > 0 && (
            <span className="text-white/40 text-xs">
              {channel.members.join(' · ')}
            </span>
          )}
        </div>

        {/* Follow button */}
        {!isOwnProfile && authUser && (
          <div className="mt-4">
            <FollowButton
              targetUserId={userId}
              className="w-full justify-center"
              onFollowChange={(isFollowing) => {
                setFollowStats(prev => ({
                  ...prev,
                  followers: isFollowing ? prev.followers + 1 : prev.followers - 1,
                }))
              }}
            />
          </div>
        )}
        {!isOwnProfile && !authUser && (
          <div className="mt-4">
            <Link href="/login" className="block w-full text-center btn-primary py-2.5 rounded-xl font-semibold text-sm text-white">
              Sign in to Follow
            </Link>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-0.5 mx-5" />

      {/* Reels grid header */}
      <div className="flex items-center gap-2 px-5 py-3">
        <Grid3X3 size={14} className="text-primary" />
        <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Reels</span>
      </div>

      {/* Reels grid */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
          <div className="text-4xl mb-3">🎬</div>
          <p className="text-white/50 text-sm">No reels yet</p>
          {isOwnProfile && (
            <Link href="/" className="mt-4 text-primary text-sm font-medium hover:text-primary-light transition-colors">
              Upload your first reel →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 px-0.5 pb-24">
          {videos.map((video, index) => (
            <motion.button
              key={video.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => openViewer(index)}
              className="relative aspect-[9/16] bg-surface-3 overflow-hidden group"
            >
              {video.thumbnailURL ? (
                <img src={video.thumbnailURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <video
                  src={video.videoURL}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Play size={20} fill="white" className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              {/* Trend badge */}
              <div className="absolute bottom-1 left-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/80 text-white">
                  #{video.trendTag}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Reel Viewer Modal ── */}
      <AnimatePresence>
        {viewerOpen && videos[viewerIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            {/* Video */}
            <video
              ref={videoRef}
              key={videos[viewerIndex].id}
              src={videos[viewerIndex].videoURL}
              className="h-full w-full object-cover max-w-sm mx-auto"
              loop
              playsInline
              muted={isMuted}
              onClick={() => {
                if (isPlaying) { videoRef.current?.pause(); setIsPlaying(false) }
                else { videoRef.current?.play(); setIsPlaying(true) }
              }}
            />

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            {/* Top controls */}
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-12">
              <button onClick={closeViewer} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <X size={18} className="text-white" />
              </button>
              <div className="text-white/60 text-sm">{viewerIndex + 1} / {videos.length}</div>
              <button
                onClick={() => {
                  const vid = videoRef.current
                  if (!vid) return
                  vid.muted = !isMuted
                  setIsMuted(!isMuted)
                }}
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
              >
                {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
              </button>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 inset-x-0 px-4 pb-8 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/25 border border-primary/40 text-white text-[11px] font-semibold mb-2">
                🔥 #{videos[viewerIndex].trendTag}
              </span>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full border border-primary/60 overflow-hidden bg-surface-3 flex-shrink-0">
                  {channel.profileImageURL ? (
                    <img src={channel.profileImageURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-sm font-bold">{channel.name[0]}</span>
                    </div>
                  )}
                </div>
                <span className="text-white font-bold text-sm">@{channel.name}</span>
              </div>
              {videos[viewerIndex].description && (
                <p className="text-white/80 text-sm mb-1">{videos[viewerIndex].description}</p>
              )}
              <p className="text-white/40 text-xs">{timeAgo(videos[viewerIndex].timestamp)}</p>
            </div>

            {/* Navigation arrows */}
            {viewerIndex > 0 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10"
              >
                <ChevronLeft size={20} className="text-white" />
              </motion.button>
            )}
            {viewerIndex < videos.length - 1 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10"
              >
                <ChevronRight size={20} className="text-white" />
              </motion.button>
            )}

            {/* Dot indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {videos.map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${
                  i === viewerIndex ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/30'
                }`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
