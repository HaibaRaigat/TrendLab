'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import Navigation from '@/components/Navigation'
import { Archive, ChevronRight, Heart, Calendar, Play, X, Download } from 'lucide-react'
import { formatDate, formatLikes, downloadVideo } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ArchiveEntry {
  id: string
  trendTag: string
  weekLabel: string
  trendId: string
  videoIds: string[]
  createdAt: any
}

interface ArchivedVideo {
  id: string
  videoURL: string
  likes: number
  trendTag: string
  channelId: string
  channelName?: string
  channelImage?: string
  description?: string
}

export default function ArchivesPage() {
  const [archives, setArchives] = useState<ArchiveEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedArchive, setSelectedArchive] = useState<ArchiveEntry | null>(null)
  const [archiveVideos, setArchiveVideos] = useState<ArchivedVideo[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<ArchivedVideo | null>(null)

  useEffect(() => {
    loadArchives()
  }, [])

  const loadArchives = async () => {
    setIsLoading(true)
    try {
      const db = getDb()
      const snap = await getDocs(query(collection(db, 'archives'), orderBy('createdAt', 'desc')))
      setArchives(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ArchiveEntry[])
    } catch (err) {
      console.error('Failed to load archives:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const openArchive = async (archive: ArchiveEntry) => {
    setSelectedArchive(archive)
    setLoadingVideos(true)
    setArchiveVideos([])

    try {
      const db = getDb()
      const videoPromises = archive.videoIds.map(async (id) => {
        const snap = await getDoc(doc(db, 'videos', id))
        if (!snap.exists()) return null
        const data = snap.data()

        // Get channel info
        let channelName = 'Unknown'
        let channelImage = ''
        if (data.channelId) {
          try {
            const channelSnap = await getDoc(doc(db, 'channels', data.channelId))
            if (channelSnap.exists()) {
              channelName = channelSnap.data().name
              channelImage = channelSnap.data().profileImageURL
            }
          } catch {}
        }

        return {
          id: snap.id,
          videoURL: data.videoURL,
          likes: data.likes || 0,
          trendTag: data.trendTag,
          channelId: data.channelId,
          channelName,
          channelImage,
          description: data.description,
        } as ArchivedVideo
      })

      const results = (await Promise.all(videoPromises)).filter(Boolean) as ArchivedVideo[]
      results.sort((a, b) => b.likes - a.likes)
      setArchiveVideos(results)
    } catch (err) {
      console.error('Failed to load archive videos:', err)
    } finally {
      setLoadingVideos(false)
    }
  }

  return (
    <div className="min-h-dvh bg-surface pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <Archive size={20} className="text-primary" />
            <h1 className="text-white font-bold text-2xl">Trend Archives</h1>
          </div>
          <p className="text-white/40 text-sm">Past weekly challenges, sorted by top-liked reels</p>
        </motion.div>
      </div>

      {/* Archives list */}
      {isLoading ? (
        <div className="px-5 space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 rounded-2xl shimmer" />
          ))}
        </div>
      ) : archives.length === 0 ? (
        <div className="text-center py-20 px-8">
          <Archive size={48} className="mx-auto text-white/15 mb-4" />
          <h3 className="text-white/50 font-medium">No archives yet</h3>
          <p className="text-white/30 text-sm mt-2">
            Archives are created by the admin at the end of each week
          </p>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {archives.map((archive, i) => (
            <motion.button
              key={archive.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openArchive(archive)}
              className="w-full archive-card rounded-2xl p-4 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full trend-badge text-white text-xs font-bold">
                      🔥 #{archive.trendTag}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs flex items-center gap-1.5">
                    <Calendar size={11} />
                    {archive.weekLabel}
                  </p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {archive.videoIds.length} reels
                  </p>
                </div>
                <ChevronRight size={18} className="text-white/30 flex-shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Archive detail modal */}
      <AnimatePresence>
        {selectedArchive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 top-0 bg-surface overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 glass border-b border-white/10 px-5 py-4 flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full trend-badge text-white text-xs font-bold mb-1">
                    🔥 #{selectedArchive.trendTag}
                  </span>
                  <p className="text-white/40 text-xs">{selectedArchive.weekLabel}</p>
                </div>
                <button
                  onClick={() => setSelectedArchive(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>

              <div className="p-5 pb-24 space-y-3">
                {loadingVideos ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : archiveVideos.length === 0 ? (
                  <div className="text-center py-12 text-white/30">
                    <p>No videos in this archive</p>
                  </div>
                ) : (
                  archiveVideos.map((video, i) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-surface-2 rounded-2xl overflow-hidden border border-white/8"
                    >
                      <div className="flex gap-3 p-3">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-8 text-center pt-1">
                          {i === 0 && <span className="text-xl">🥇</span>}
                          {i === 1 && <span className="text-xl">🥈</span>}
                          {i === 2 && <span className="text-xl">🥉</span>}
                          {i > 2 && <span className="text-white/30 font-bold text-sm">#{i + 1}</span>}
                        </div>

                        {/* Thumbnail / play button */}
                        <button
                          onClick={() => setPlayingVideo(video)}
                          className="w-16 h-24 rounded-xl bg-surface-3 flex-shrink-0 overflow-hidden relative group"
                        >
                          <video
                            src={video.videoURL}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                              <Play size={14} fill="white" className="text-white ml-0.5" />
                            </div>
                          </div>
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {video.channelImage ? (
                                <img src={video.channelImage} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-primary text-[10px] font-bold">
                                    {(video.channelName || '?')[0]}
                                  </span>
                                </div>
                              )}
                              <span className="text-white font-semibold text-xs truncate">
                                @{video.channelName}
                              </span>
                            </div>
                            {video.description && (
                              <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">
                                {video.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="flex items-center gap-1 text-rose-400 text-xs font-medium">
                              <Heart size={11} fill="currentColor" />
                              {formatLikes(video.likes)}
                            </span>
                            <button
                              onClick={() => downloadVideo(video.videoURL, `trendlab-${video.channelName}.mp4`)}
                              className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors text-xs"
                            >
                              <Download size={11} />
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video player overlay */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
            onClick={() => setPlayingVideo(null)}
          >
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center"
            >
              <X size={20} className="text-white" />
            </button>
            <video
              src={playingVideo.videoURL}
              autoPlay
              controls
              playsInline
              className="w-full h-full max-w-sm object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />
    </div>
  )
}
