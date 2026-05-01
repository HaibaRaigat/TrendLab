'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Upload, Video, Check,
  AlertCircle, Loader2
} from 'lucide-react'
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

interface Trend {
  id: string
  tag: string
  weekLabel: string
  active: boolean
}

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'video' | 'details' | 'uploading' | 'done'

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('video')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [trends, setTrends] = useState<Trend[]>([])
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)
  const [description, setDescription] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const videoInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadTrends()
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setStep('video')
    setVideoFile(null)
    setVideoPreview(null)
    setVideoDuration(0)
    setSelectedTrend(null)
    setDescription('')
    setUploadProgress(0)
    setError('')
  }

  const loadTrends = async () => {
    try {
      const db = getDb()
      const snapshot = await getDocs(
        query(collection(db, 'trends'), where('active', '==', true), orderBy('createdAt', 'desc'))
      )
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Trend[]
      setTrends(loaded)
      if (loaded.length > 0) setSelectedTrend(loaded[0])
    } catch (err) {
      console.error('Failed to load trends:', err)
    }
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file.')
      return
    }

    const url = URL.createObjectURL(file)
    const vid = document.createElement('video')
    vid.src = url
    vid.onloadedmetadata = () => {
      if (vid.duration > 180) {
        setError('Video must be 3 minutes or less.')
        URL.revokeObjectURL(url)
        return
      }
      setVideoDuration(vid.duration)
      setVideoFile(file)
      setVideoPreview(url)
    }
  }

  // ── Cloudinary upload helper ───────────────────────────────────────────────
  const uploadToCloudinary = async (
    file: File,
    resourceType: 'video' | 'image',
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const preset   = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !preset) throw new Error('Cloudinary env vars missing.')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', preset)
    formData.append('folder', `trendlab/${resourceType}s`)

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText).secure_url as string)
        } else {
          reject(new Error(`Cloudinary error: ${xhr.status}`))
        }
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(formData)
    })
  }
  // ────────────────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!videoFile || !selectedTrend) {
      setError('Please select a video and trend.')
      return
    }
    if (!user?.channelId) {
      setError('You must be logged in to upload.')
      return
    }
    setStep('uploading')
    setError('')

    try {
      const db = getDb()

      // Upload video → Cloudinary (with live progress)
      const videoURL = await uploadToCloudinary(videoFile, 'video', (pct) =>
        setUploadProgress(pct)
      )

      // Save metadata to Firestore — channelId from auth user
      await addDoc(collection(db, 'videos'), {
        videoURL,
        likes: 0,
        channelId: user.channelId,
        trendId: selectedTrend.id,
        trendTag: selectedTrend.tag,
        description: description.trim(),
        duration: Math.round(videoDuration),
        archived: false,
        timestamp: serverTimestamp(),
      })

      setStep('done')
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Upload failed. Please try again.')
      setStep('details')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full sm:max-w-md bg-surface-2 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92dvh] flex flex-col border border-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
            <div>
              <h2 className="text-white font-bold text-lg">
                {step === 'video' && '📹 Select Video'}
                {step === 'details' && '✨ Final Details'}
                {step === 'uploading' && '⬆️ Uploading...'}
                {step === 'done' && '🎉 Published!'}
              </h2>
              <p className="text-white/40 text-xs mt-0.5">
                {step === 'video' && 'Max 3 minutes · Vertical preferred'}
                {step === 'details' && 'Add trend & description'}
                {step === 'uploading' && `${uploadProgress}% complete`}
                {step === 'done' && 'Your reel is live!'}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>

          {/* Step indicators */}
          {step !== 'uploading' && step !== 'done' && (
            <div className="flex items-center gap-1.5 px-5 py-3 flex-shrink-0">
              {['video', 'details'].map((s, i) => (
                <div key={s} className={cn(
                  'h-1 rounded-full flex-1 transition-all duration-300',
                  ['video', 'details'].indexOf(step) >= i ? 'bg-primary' : 'bg-white/10'
                )} />
              ))}
            </div>
          )}

          {/* Channel info banner (when logged in) */}
          {user?.channel && step !== 'uploading' && step !== 'done' && (
            <div className="mx-5 mb-0 mt-1 flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/15">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/40 flex-shrink-0 bg-surface-3">
                {user.channel.profileImageURL ? (
                  <img src={user.channel.profileImageURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{user.channel.name[0]}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{user.channel.name}</p>
                <p className="text-white/40 text-xs">Posting as this channel</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* STEP: VIDEO */}
            {step === 'video' && (
              <div className="p-5 space-y-4">
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />

                {!videoPreview ? (
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full h-56 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/60 transition-all flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-primary/5"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Video size={32} className="text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">Tap to select video</p>
                      <p className="text-white/40 text-sm mt-1">MP4, MOV · Max 3 min</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-64 mx-auto" style={{ maxWidth: 144 }}>
                    <video
                      ref={videoPreviewRef}
                      src={videoPreview}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      loop
                      autoPlay
                    />
                    <button
                      onClick={() => { setVideoFile(null); setVideoPreview(null) }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                    >
                      <X size={14} className="text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="glass-dark rounded-lg px-2 py-1 text-center">
                        <span className="text-white text-xs font-medium">
                          {Math.floor(videoDuration / 60)}:{String(Math.floor(videoDuration % 60)).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP: DETAILS */}
            {step === 'details' && (
              <div className="p-5 space-y-4">
                {/* Trend selector */}
                <div>
                  <p className="text-white/60 text-xs mb-2">🔥 Select Trend</p>
                  {trends.length === 0 ? (
                    <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <p className="text-amber-400 text-sm text-center">No active trend. Admin must create one first.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {trends.map(trend => (
                        <button
                          key={trend.id}
                          onClick={() => setSelectedTrend(trend)}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                            selectedTrend?.id === trend.id
                              ? 'bg-primary/10 border-primary/50 text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                          )}
                        >
                          <div>
                            <p className="font-semibold text-sm">#{trend.tag}</p>
                            <p className="text-xs opacity-60 mt-0.5">{trend.weekLabel}</p>
                          </div>
                          {selectedTrend?.id === trend.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check size={11} className="text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <p className="text-white/60 text-xs mb-2">📝 Description (optional)</p>
                  <textarea
                    placeholder="Describe your Excel skill..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    maxLength={150}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:border-primary/50 transition-colors resize-none"
                  />
                  <p className="text-white/30 text-xs text-right mt-1">{description.length}/150</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP: UPLOADING */}
            {step === 'uploading' && (
              <div className="p-8 flex flex-col items-center justify-center gap-6">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                    <circle
                      cx="50" cy="50" r="42"
                      stroke="#49A546"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - uploadProgress / 100)}`}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{uploadProgress}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">Uploading your reel...</p>
                  <p className="text-white/40 text-sm mt-1">Please don't close this window</p>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* STEP: DONE */}
            {step === 'done' && (
              <div className="p-8 flex flex-col items-center justify-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center"
                >
                  <span className="text-5xl">🎬</span>
                </motion.div>
                <div className="text-center">
                  <h3 className="text-white font-bold text-xl">Reel Published!</h3>
                  <p className="text-white/50 text-sm mt-2">
                    Your Excel skill is now live on TrendLab
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="btn-primary w-full py-3 rounded-xl font-semibold text-white"
                >
                  View Feed
                </button>
              </div>
            )}
          </div>

          {/* Footer actions */}
          {step !== 'uploading' && step !== 'done' && (
            <div className="p-5 border-t border-white/10 flex-shrink-0 flex gap-3">
              {step !== 'video' && (
                <button
                  onClick={() => {
                    const steps: Step[] = ['video', 'details']
                    const i = steps.indexOf(step)
                    if (i > 0) setStep(steps[i - 1])
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/15 text-white/70 font-medium text-sm hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  if (step === 'video') {
                    if (!videoFile) { setError('Please select a video first.'); return }
                    setError('')
                    setStep('details')
                  } else if (step === 'details') {
                    handleUpload()
                  }
                }}
                className="flex-1 btn-primary py-3 rounded-xl font-semibold text-sm"
              >
                {step === 'details' ? '🚀 Publish Reel' : 'Continue →'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
