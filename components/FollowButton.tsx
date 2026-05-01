'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  targetUserId: string
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export default function FollowButton({ targetUserId, className, onFollowChange }: FollowButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!user || !targetUserId) { setIsLoading(false); return }
    checkFollowStatus()
  }, [user, targetUserId])

  const checkFollowStatus = async () => {
    try {
      const res = await fetch(`/api/follows?targetUserId=${targetUserId}&currentUserId=${user!.id}`)
      const data = await res.json()
      setIsFollowing(data.isFollowing)
    } catch { /* ignore */ } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async () => {
    if (!user || isProcessing) return
    setIsProcessing(true)

    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing) // optimistic

    try {
      const res = await fetch('/api/follows', {
        method: wasFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId }),
      })

      if (!res.ok) {
        setIsFollowing(wasFollowing) // revert
      } else {
        onFollowChange?.(!wasFollowing)
      }
    } catch {
      setIsFollowing(wasFollowing)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!user || user.id === targetUserId) return null

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      disabled={isLoading || isProcessing}
      className={cn(
        'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
        isFollowing
          ? 'bg-white/10 border border-white/20 text-white/80 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
          : 'btn-primary text-white',
        'disabled:opacity-50',
        className
      )}
    >
      {isLoading || isProcessing ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isFollowing ? (
        <><UserCheck size={14} /> Following</>
      ) : (
        <><UserPlus size={14} /> Follow</>
      )}
    </motion.button>
  )
}
