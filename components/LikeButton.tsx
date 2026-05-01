'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { doc, runTransaction, increment, getDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { formatLikes } from '@/lib/utils'

interface LikeButtonProps {
  videoId: string
  initialLikes: number
  onLikeChange?: (newCount: number) => void
}

interface Particle {
  id: number
  x: number
  y: number
}

export default function LikeButton({ videoId, initialLikes, onLikeChange }: LikeButtonProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialLikes)
  const [isLoading, setIsLoading] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])

  // Check if the current user has already liked this video
  useEffect(() => {
    if (!user) {
      setLiked(false)
      return
    }
    const checkLike = async () => {
      try {
        const db = getDb()
        const likeRef = doc(db, `videos/${videoId}/likes`, user.id)
        const snap = await getDoc(likeRef)
        setLiked(snap.exists())
      } catch { /* ignore */ }
    }
    checkLike()
  }, [videoId, user])

  useEffect(() => {
    setCount(initialLikes)
  }, [initialLikes])

  const spawnParticles = useCallback(() => {
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: -(Math.random() * 60 + 20),
    }))
    setParticles(newParticles)
    setTimeout(() => setParticles([]), 1000)
  }, [])

  const handleLike = async () => {
    if (liked || isLoading || !user) return
    setIsLoading(true)

    // Optimistic update
    setLiked(true)
    const newCount = count + 1
    setCount(newCount)
    onLikeChange?.(newCount)
    spawnParticles()

    try {
      const db = getDb()
      const videoRef = doc(db, 'videos', videoId)
      // Use userId as the like document ID — one like per account per video
      const likeRef = doc(db, `videos/${videoId}/likes`, user.id)

      await runTransaction(db, async (transaction) => {
        const likeDoc = await transaction.get(likeRef)
        if (likeDoc.exists()) {
          throw new Error('Already liked')
        }
        transaction.set(likeRef, {
          userId: user.id,
          timestamp: new Date(),
        })
        transaction.update(videoRef, { likes: increment(1) })
      })
    } catch (err: any) {
      if (err?.message !== 'Already liked') {
        // Revert on error
        setLiked(false)
        setCount(prev => prev - 1)
        onLikeChange?.(count)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 relative">
      {/* Floating particles */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute pointer-events-none"
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: particle.x, y: particle.y, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Heart size={12} fill="#ff3b5c" className="text-rose-500" />
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleLike}
        disabled={liked || isLoading || !user}
        className="relative flex flex-col items-center gap-1 group"
        aria-label={liked ? 'Already liked' : 'Like this video'}
      >
        <motion.div
          animate={liked ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center
            transition-all duration-200 relative
            ${liked
              ? 'bg-rose-500/20'
              : !user
                ? 'bg-black/20 opacity-50'
                : 'bg-black/30 group-hover:bg-white/10'
            }
          `}
        >
          <Heart
            size={26}
            strokeWidth={liked ? 0 : 2}
            fill={liked ? '#ff3b5c' : 'transparent'}
            className={`
              transition-all duration-200
              ${liked ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(255,59,92,0.8)]' : 'text-white'}
            `}
          />

          {/* Ripple effect */}
          {liked && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full bg-rose-500/30"
            />
          )}
        </motion.div>

        <span className={`
          text-xs font-semibold transition-colors
          ${liked ? 'text-rose-400' : 'text-white/90'}
        `}>
          {formatLikes(count)}
        </span>
      </motion.button>
    </div>
  )
}
