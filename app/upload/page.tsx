'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import UploadModal from '@/components/UploadModal'
import { Video, Sparkles, Users, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const features = [
  {
    icon: Video,
    title: 'Short Excel Reels',
    description: 'Share your Excel skills in vertical videos up to 3 minutes',
  },
  {
    icon: TrendingUp,
    title: 'Weekly Trends',
    description: 'Participate in the weekly trend challenge and get featured',
  },
  {
    icon: Users,
    title: 'Team Channels',
    description: 'Create individual or group channels for your BMO team',
  },
  {
    icon: Sparkles,
    title: 'Get Recognized',
    description: 'Earn likes and climb the leaderboard by sharing quality content',
  },
]

export default function UploadPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/20 via-transparent to-transparent" />
        <div className="relative px-5 pt-14 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6"
          >
            <img src="/logo.png" alt="TrendLab Logo" className="w-[70px] h-[70px] object-contain drop-shadow-md" />
            <span className="-ml-2 text-white font-bold text-4xl tracking-wide">TrendLab</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-white font-bold text-3xl leading-tight">
              Share your<br />
              <span className="text-primary">Excel Skills</span>
            </h1>
            <p className="text-white/50 mt-3 text-sm leading-relaxed">
              Upload short vertical reels to showcase your Excel expertise with the BMO program community
            </p>
          </motion.div>
        </div>
      </div>

      {/* Upload CTA */}
      <div className="px-5 mb-8">
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setModalOpen(true)}
          className="w-full relative overflow-hidden rounded-2xl p-px"
          style={{ background: 'linear-gradient(135deg, #49A546, #1B6121)' }}
        >
          <div className="w-full rounded-2xl bg-surface-2 hover:bg-transparent transition-colors duration-300 p-6 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
              <Video size={36} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">Upload a Reel</p>
              <p className="text-white/50 text-sm mt-1">Tap to start uploading</p>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <span>MP4 · MOV</span>
              <span>·</span>
              <span>Max 3 min</span>
              <span>·</span>
              <span>Vertical</span>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Features */}
      <div className="px-5">
        <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">
          Why Upload?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 3) }}
              className="bg-surface-2 rounded-2xl p-4 border border-white/8"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <Icon size={18} className="text-primary" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">{title}</p>
              <p className="text-white/40 text-xs leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Program info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mx-5 mt-6 p-4 rounded-2xl border border-primary/20 bg-primary/5"
      >
        <p className="text-primary font-semibold text-sm mb-1">📚 BMO Program · ISTA NTIC Guelmim</p>
        <p className="text-white/40 text-xs leading-relaxed">
          This platform is exclusively for trainees of the BMO Excel program. Share your learning journey and inspire your peers.
        </p>
      </motion.div>

      <Navigation />
      <UploadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
