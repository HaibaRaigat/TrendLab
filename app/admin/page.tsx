'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminPanel from '@/components/AdminPanel'

type AuthState = 'checking' | 'login' | 'authenticated'

export default function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(10).fill(''))
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockout, setLockout] = useState(0) // seconds remaining
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const lockoutTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    checkSession()
    return () => {
      if (lockoutTimer.current) clearInterval(lockoutTimer.current)
    }
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/verify-admin')
      const data = await res.json()
      setAuthState(data.authenticated ? 'authenticated' : 'login')
    } catch {
      setAuthState('login')
    }
  }

  const handleDigitInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const digit = value.slice(-1)
    const newDigits = [...codeDigits]
    newDigits[index] = digit

    setCodeDigits(newDigits)
    setError('')

    if (digit && index < 9) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter' && codeDigits.every(d => d !== '')) {
      handleVerify()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10)
    if (!paste) return
    const newDigits = Array(10).fill('')
    paste.split('').forEach((d, i) => { newDigits[i] = d })
    setCodeDigits(newDigits)
    inputRefs.current[Math.min(paste.length, 9)]?.focus()
  }

  const handleVerify = async () => {
    if (lockout > 0 || isVerifying) return
    const code = codeDigits.join('')
    if (code.length !== 10) {
      setError('Please enter the complete 10-digit code')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (data.success) {
        setAuthState('authenticated')
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setCodeDigits(Array(10).fill(''))
        inputRefs.current[0]?.focus()

        if (newAttempts >= 3) {
          const lockoutTime = Math.min(30 * newAttempts, 300)
          setLockout(lockoutTime)
          lockoutTimer.current = setInterval(() => {
            setLockout(prev => {
              if (prev <= 1) {
                clearInterval(lockoutTimer.current!)
                return 0
              }
              return prev - 1
            })
          }, 1000)
          setError(`Too many attempts. Wait ${lockoutTime} seconds.`)
        } else {
          setError(`Invalid code. ${3 - newAttempts} attempt${3 - newAttempts !== 1 ? 's' : ''} remaining.`)
        }
      }
    } catch {
      setError('Verification failed. Try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/verify-admin', { method: 'DELETE' })
    setAuthState('login')
    setCodeDigits(Array(10).fill(''))
    setAttempts(0)
  }

  if (authState === 'checking') {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (authState === 'authenticated') {
    return <AdminPanel onLogout={handleLogout} />
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-5">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-dark/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-4">
            <span className="text-primary font-bold text-2xl">T</span>
          </div>
          <h1 className="text-white font-bold text-2xl">Admin Access</h1>
          <p className="text-white/40 text-sm mt-1">Enter your 10-digit security code</p>
        </div>

        {/* Code input */}
        <div className="bg-surface-2 rounded-3xl p-6 border border-white/10">
          <div className="flex gap-1.5 justify-center mb-6 flex-wrap" onPaste={handlePaste}>
            {codeDigits.map((digit, i) => (
              <motion.input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={lockout > 0 || isVerifying}
                className={`
                  w-9 h-11 rounded-xl text-center text-white font-bold text-lg
                  border transition-all duration-200 bg-white/5
                  focus:outline-none focus:ring-0
                  disabled:opacity-50
                  ${digit
                    ? 'border-primary/60 bg-primary/10 shadow-[0_0_10px_rgba(73,165,70,0.2)]'
                    : 'border-white/15 hover:border-white/25'
                  }
                `}
                style={{ caretColor: 'transparent' }}
              />
            ))}
          </div>

          {/* Verify button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleVerify}
            disabled={lockout > 0 || isVerifying || codeDigits.some(d => !d)}
            className="w-full btn-primary py-3.5 rounded-xl font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : lockout > 0 ? (
              `Locked — ${lockout}s`
            ) : (
              'Access Admin Panel →'
            )}
          </motion.button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-xs text-center mt-3 font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Disclaimer */}
        <p className="text-white/20 text-xs text-center mt-6">
          This page is not publicly advertised
        </p>
      </motion.div>
    </div>
  )
}
