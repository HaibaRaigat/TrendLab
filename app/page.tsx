'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Navigation'
import { useAuth } from '@/lib/auth-context'

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
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // If not logged in, redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="h-dvh bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-white/40 text-sm font-medium">Loading TrendLab...</span>
        </div>
      </div>
    )
  }

  return (
    <main className="relative">
      <ReelsContainer />
      <Navigation />
    </main>
  )
}
