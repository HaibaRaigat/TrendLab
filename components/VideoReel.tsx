'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Download, CheckCircle } from 'lucide-react'
import LikeButton from './LikeButton'
import { VideoWithChannel } from '@/types'
import { downloadVideo, timeAgo } from '@/lib/utils'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

interface VideoReelProps {
  video: VideoWithChannel
  isActive: boolean
  index: number
}

export default function VideoReel({ video, isActive, index }: VideoReelProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showPlayIcon, setShowPlayIcon] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [channelUserId, setChannelUserId] = useState<string | null>(null)
  const doubleTapTimer = useRef<NodeJS.Timeout | null>(null)
  const tapCount = useRef(0)

  // Fetch the userId associated with this channel for profile navigation
  useEffect(() => {
    if (!video.channel?.id) return
    const fetchUserId = async () => {
      try {
        const db = getDb()
        const snap = await getDocs(
          query(collection(db, 'users'), where('channelId', '==', video.channel!.id))
        )
        if (!snap.empty) {
          setChannelUserId(snap.docs[0].id)
        }
      } catch { /* ignore */ }
    }
    fetchUserId()
  }, [video.channel?.id])

  // --- Play/Pause logic ---
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    if (isActive) {
      vid.currentTime = 0
      vid.muted = isMuted

      const playPromise = vid.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => { setIsPlaying(true) })
          .catch(() => {
            const handleFirstInteraction = () => {
              vid.muted = false
              setIsMuted(false)
              vid.play().then(() => setIsPlaying(true)).catch(console.error)
            }
            window.addEventListener('touchstart', handleFirstInteraction, { once: true })
            window.addEventListener('click', handleFirstInteraction, { once: true })
          })
      }
    } else {
      vid.pause()
      vid.currentTime = 0
      setIsPlaying(false)
    }

    return () => {
      vid.pause()
      vid.currentTime = 0
    }
  }, [isActive])

  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current
    if (!vid || !vid.duration) return
    setProgress((vid.currentTime / vid.duration) * 100)
  }, [])

  const handleVideoEnd = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.currentTime = 0
    vid.play().catch(() => { })
  }, [])

  const togglePlay = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return

    if (isPlaying) {
      vid.pause()
      setIsPlaying(false)
    } else {
      vid.play().then(() => setIsPlaying(true))
    }

    setShowPlayIcon(true)
    setTimeout(() => setShowPlayIcon(false), 800)
  }, [isPlaying])

  const handleTap = useCallback(() => {
    tapCount.current += 1
    if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current)

    doubleTapTimer.current = setTimeout(() => {
      if (tapCount.current === 1) {
        togglePlay()
      }
      tapCount.current = 0
    }, 300)
  }, [togglePlay])

  const handleDoubleTap = useCallback(() => {
    setShowHeart(true)
    setTimeout(() => setShowHeart(false), 800)
  }, [])

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDownloading) return
    setIsDownloading(true)
    try {
      await downloadVideo(
        video.videoURL,
        `trendlab-${video.channel?.name || 'video'}-${video.trendTag}.mp4`
      )
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const vid = videoRef.current
    if (!vid) return
    const newMuteStatus = !isMuted
    vid.muted = newMuteStatus
    setIsMuted(newMuteStatus)
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (channelUserId) {
      router.push(`/profile/${channelUserId}`)
    }
  }

  return (
    <div className="relative bg-black overflow-hidden h-full w-full" style={{ touchAction: 'pan-y' }}>
      {/* Video element */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleTap}
        onDoubleClick={handleDoubleTap}
      >
        <video
          ref={videoRef}
          src={video.videoURL}
          loop
          muted={isMuted}
          playsInline
          preload={isActive ? 'auto' : 'metadata'}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
          onLoadedData={() => setIsLoaded(true)}
        />

        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-3">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="loading-dot w-2 h-2 rounded-full bg-primary animate-pulse" />
              ))}
            </div>
          </div>
        )}

        <div className="gradient-top absolute inset-x-0 top-0 h-40 pointer-events-none" />
        <div className="gradient-bottom absolute inset-x-0 bottom-0 h-80 pointer-events-none" />
      </div>

      {/* Play/Pause indicator */}
      <AnimatePresence>
        {showPlayIcon && (
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              {isPlaying ? <Play size={36} fill="white" className="text-white ml-1" /> : <Pause size={36} fill="white" className="text-white" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heart animation on double tap */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <span className="text-7xl">❤️</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Elements - Top */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="TrendLab Logo"
            className="w-10 h-10 object-contain drop-shadow-md opacity-96"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<div class="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center opacity-70"><span class="text-primary font-bold text-lg">T</span></div>')
            }}
          />
          <span className="-ml-3 text-[#262626]/70 font-semibold text-base tracking-wide drop-shadow-md">TrendLab</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10"
        >
          {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
        </motion.button>
      </div>

      {/* Right Sidebar */}
      <div className="absolute right-4 bottom-28 z-20 flex flex-col items-center gap-5">
        {/* Profile image — clickable */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleProfileClick}
          className="relative"
        >
          <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden bg-surface-3">
            {video.channel?.profileImageURL ? (
              <img src={video.channel.profileImageURL} alt={video.channel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/20">
                <span className="text-primary font-bold text-lg">{(video.channel?.name || '?')[0].toUpperCase()}</span>
              </div>
            )}
          </div>
          {channelUserId && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-surface-3">
              <span className="text-white text-[9px] font-bold">+</span>
            </div>
          )}
        </motion.button>

        <LikeButton videoId={video.id} initialLikes={video.likes} />

        <motion.button whileTap={{ scale: 0.85 }} onClick={handleDownload} className="flex flex-col items-center gap-1 group" disabled={isDownloading}>
          <div className="w-12 h-12 rounded-full bg-black/30 group-hover:bg-white/10 flex items-center justify-center">
            {isDownloading ? <div className="w-5 h-5 border-2 border-white/50 border-t-primary rounded-full animate-spin" /> : downloaded ? <CheckCircle size={24} className="text-primary" /> : <Download size={24} className="text-white" />}
          </div>
          <span className="text-white/80 text-[10px] font-medium">{downloaded ? 'Saved' : 'Save'}</span>
        </motion.button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-24 pointer-events-none">
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-white text-[10px] font-semibold">
            🔥 {video.trendTag}
          </span>
        </div>
        <div className="mb-1">
          <h3 className="text-white font-bold text-base">@{video.channel?.name || 'Unknown'}</h3>
        </div>
        {/* Show members */}
        {video.channel?.members && video.channel.members.length > 0 && (
          <p className="text-white/50 text-xs mb-1">
            {video.channel.type === 'individual' ? '' : '👥 '}
            {video.channel.members.join(' · ')}
          </p>
        )}
        {video.description && <p className="text-white/80 text-sm line-clamp-2 mb-2">{video.description}</p>}
        <p className="text-white/40 text-[10px]">{timeAgo(video.timestamp)}</p>

        {/* Custom Progress Bar */}
        <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}