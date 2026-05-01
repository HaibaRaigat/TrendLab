'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Users, Upload, Search, Check, X,
  AlertCircle, Loader2, Eye, EyeOff, ArrowLeft, ChevronRight
} from 'lucide-react'
import { STUDENTS_LIST } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

type Step = 'type' | 'members' | 'channel' | 'credentials'

export default function RegisterPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [step, setStep] = useState<Step>('type')
  const [channelType, setChannelType] = useState<'individual' | 'group'>('individual')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [channelName, setChannelName] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  const filteredMembers = STUDENTS_LIST.filter(m =>
    m.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const toggleMember = (member: string) => {
    if (channelType === 'individual') {
      setSelectedMembers([member])
      setChannelName(member)
    } else {
      setSelectedMembers(prev =>
        prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
      )
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfileImage(file)
    setProfilePreview(URL.createObjectURL(file))
  }

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !preset) return ''

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', preset)
    formData.append('folder', 'trendlab/profiles')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    return data.secure_url || ''
  }

  const canProceedFromMembers = () => {
    if (channelType === 'individual') return selectedMembers.length === 1
    return selectedMembers.length >= 2
  }

  const handleNext = () => {
    setError('')
    if (step === 'type') {
      setStep('members')
    } else if (step === 'members') {
      if (!canProceedFromMembers()) {
        setError(channelType === 'individual' ? 'Choose your name from the list' : 'Select at least 2 members')
        return
      }
      setStep('channel')
    } else if (step === 'channel') {
      if (!channelName.trim()) { setError('Channel name is required'); return }
      setStep('credentials')
    }
  }

  const handleBack = () => {
    setError('')
    if (step === 'members') setStep('type')
    else if (step === 'channel') setStep('members')
    else if (step === 'credentials') setStep('channel')
  }

  const handleRegister = async () => {
    if (!identifier.trim() || identifier.trim().length < 3) {
      setError('Identifier must be at least 3 characters')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      let profileImageURL = ''
      if (profileImage) {
        profileImageURL = await uploadImageToCloudinary(profileImage)
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          channelName: channelName.trim(),
          channelType,
          members: selectedMembers,
          profileImageURL,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      await refresh()
      router.push('/')
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const steps: Step[] = ['type', 'members', 'channel', 'credentials']
  const stepIndex = steps.indexOf(step)

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-5 py-8">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary-dark/8 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="TrendLab" className="w-10 h-10 object-contain"
              onError={e => { e.currentTarget.style.display = 'none' }} />
            <span className="text-white font-bold text-xl">TrendLab</span>
          </div>
          <h1 className="text-white font-bold text-2xl">Create Account</h1>
          <p className="text-white/40 text-sm mt-1">Join the Excel skills community</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((s, i) => (
            <div key={s} className={cn(
              'h-1 rounded-full flex-1 transition-all duration-500',
              i <= stepIndex ? 'bg-primary' : 'bg-white/10'
            )} />
          ))}
        </div>

        {/* Card */}
        <div className="bg-surface-2 rounded-3xl border border-white/10 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-4"
            >
              {/* STEP: TYPE */}
              {step === 'type' && (
                <>
                  <div>
                    <h2 className="text-white font-semibold text-base mb-1">Account Type</h2>
                    <p className="text-white/40 text-xs">Are you registering individually or as a group?</p>
                  </div>
                  <div className="space-y-3">
                    {(['individual', 'group'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setChannelType(type)}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left',
                          channelType === type
                            ? 'bg-primary/10 border-primary/50'
                            : 'bg-white/3 border-white/10 hover:border-white/20'
                        )}
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          channelType === type ? 'bg-primary/20' : 'bg-white/5'
                        )}>
                          {type === 'individual' ? (
                            <User size={22} className={channelType === type ? 'text-primary' : 'text-white/40'} />
                          ) : (
                            <Users size={22} className={channelType === type ? 'text-primary' : 'text-white/40'} />
                          )}
                        </div>
                        <div>
                          <p className={cn(
                            'font-semibold text-sm',
                            channelType === type ? 'text-white' : 'text-white/60'
                          )}>
                            {type === 'individual' ? 'Individual' : 'Group'}
                          </p>
                          <p className="text-white/30 text-xs mt-0.5">
                            {type === 'individual' ? 'Your personal channel' : 'Team channel with multiple members'}
                          </p>
                        </div>
                        {channelType === type && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* STEP: MEMBERS */}
              {step === 'members' && (
                <>
                  <div>
                    <h2 className="text-white font-semibold text-base mb-1">
                      {channelType === 'individual' ? 'Select Your Name' : `Select Members (${selectedMembers.length})`}
                    </h2>
                    <p className="text-white/40 text-xs">
                      {channelType === 'individual' ? 'Choose your name from the list' : 'Select 2 or more members'}
                    </p>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-white/30 focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
                    {filteredMembers.map(member => (
                      <button
                        key={member}
                        onClick={() => toggleMember(member)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="text-white text-sm">{member}</span>
                        {selectedMembers.includes(member) && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* STEP: CHANNEL */}
              {step === 'channel' && (
                <>
                  <div>
                    <h2 className="text-white font-semibold text-base mb-1">Channel Setup</h2>
                    <p className="text-white/40 text-xs">Name your channel and add a profile picture</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all"
                    >
                      {profilePreview ? (
                        <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Upload size={18} className="text-white/30" />
                          <span className="text-white/30 text-[10px]">Photo</span>
                        </div>
                      )}
                    </button>
                    <div className="flex-1">
                      <label className="text-white/50 text-xs mb-1.5 block">Channel Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. ExcelMasters"
                        value={channelName}
                        onChange={e => setChannelName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                  {/* Show selected members */}
                  {selectedMembers.length > 0 && (
                    <div>
                      <p className="text-white/40 text-xs mb-2">
                        {channelType === 'individual' ? 'Member' : 'Members'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMembers.map(m => (
                          <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary-light">
                            {m.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* STEP: CREDENTIALS */}
              {step === 'credentials' && (
                <>
                  <div>
                    <h2 className="text-white font-semibold text-base mb-1">Create Credentials</h2>
                    <p className="text-white/40 text-xs">Choose any identifier and password you can remember</p>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">
                      Your ID / Identifier *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. oussama2024, ExcelKing, 1234..."
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:border-primary/50 transition-colors"
                    />
                    <p className="text-white/25 text-[11px] mt-1.5">Your unique login ID — can be anything you remember</p>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Anything — numbers, words, symbols..."
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 pr-10 py-2.5 text-white text-sm placeholder-white/30 focus:border-primary/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <p className="text-white/25 text-[11px] mt-1.5">No restrictions — use any password format</p>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/20"
                >
                  <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            {step !== 'type' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/15 text-white/60 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            )}
            {step !== 'credentials' ? (
              <button
                onClick={handleNext}
                className="flex-1 btn-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5"
              >
                Continue
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="flex-1 btn-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Creating...</>
                ) : (
                  '🚀 Create Account'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Login link */}
        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary-light transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
