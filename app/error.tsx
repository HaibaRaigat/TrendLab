'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="text-6xl mb-5">⚠️</div>
        <h2 className="text-white font-bold text-xl mb-2">Something went wrong</h2>
        <p className="text-white/40 text-sm mb-6 max-w-xs">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="btn-primary px-6 py-3 rounded-xl font-semibold text-white text-sm"
        >
          Try Again
        </button>
      </motion.div>
    </div>
  )
}
