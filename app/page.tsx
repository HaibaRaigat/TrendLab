'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Navigation'
import UploadModal from '@/components/UploadModal'
import { Upload } from 'lucide-react'
import { motion } from 'framer-motion'

const ReelsContainer = dynamic(() => import('@/components/ReelsContainer'), {
  ssr: false,
  loading: () => (
    <div className="h-dvh bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-white/40 text-sm font-medium">Loading TrendLab...</span>
      </div>
    </div>
  ),
})

export default function ExplorePage() {
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <main className="relative">
      <ReelsContainer />
      <Navigation />
      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </main>
  )
}
