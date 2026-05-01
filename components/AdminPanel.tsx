'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Archive, Trash2, LogOut, TrendingUp,
  Video, Check, AlertCircle, Loader2, Hash,
  Calendar, Eye, EyeOff, Users, User
} from 'lucide-react'
import {
  collection, addDoc, getDocs, query, orderBy,
  doc, updateDoc, deleteDoc, writeBatch, serverTimestamp, where
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { formatDate, getWeekLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Trend {
  id: string
  tag: string
  weekLabel: string
  active: boolean
  createdAt: any
  videoCount?: number
}

interface AdminVideo {
  id: string
  trendId: string
  trendTag: string
  likes: number
  channelId: string
  timestamp: any
  channelName?: string
}

interface AdminUser {
  id: string
  identifier: string
  type: 'individual' | 'group'
  channelId: string
  createdAt: any
  channelName?: string
  videoCount?: number
}

type AdminTab = 'trends' | 'archive' | 'videos' | 'users'

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>('trends')
  const [trends, setTrends] = useState<Trend[]>([])
  const [videos, setVideos] = useState<AdminVideo[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [newTrendTag, setNewTrendTag] = useState('')
  const [newWeekLabel, setNewWeekLabel] = useState(getWeekLabel())
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [archivingTrendId, setArchivingTrendId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const db = getDb()
      const [trendsSnap, videosSnap, usersSnap, channelsSnap] = await Promise.all([
        getDocs(query(collection(db, 'trends'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'videos'), orderBy('likes', 'desc'))),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'channels')),
      ])

      const channelMap = new Map<string, string>()
      channelsSnap.docs.forEach(d => channelMap.set(d.id, d.data().name || ''))

      const trendsData = trendsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Trend[]
      const videosData = videosSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        channelName: channelMap.get(d.data().channelId) || 'Unknown',
      })) as AdminVideo[]

      const usersData = usersSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        channelName: channelMap.get(d.data().channelId) || 'Unknown',
        videoCount: videosData.filter(v => v.channelId === d.data().channelId).length,
      })) as AdminUser[]

      const trendsWithCount = trendsData.map(t => ({
        ...t,
        videoCount: videosData.filter(v => v.trendId === t.id).length,
      }))

      setTrends(trendsWithCount)
      setVideos(videosData)
      setUsers(usersData)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createTrend = async () => {
    if (!newTrendTag.trim()) return
    setIsLoading(true)
    try {
      const db = getDb()
      const batch = writeBatch(db)
      trends.forEach(t => {
        if (t.active) batch.update(doc(db, 'trends', t.id), { active: false })
      })
      await batch.commit()

      await addDoc(collection(db, 'trends'), {
        tag: newTrendTag.trim().replace(/^#/, ''),
        weekLabel: newWeekLabel.trim() || getWeekLabel(),
        active: true,
        createdAt: serverTimestamp(),
      })

      setNewTrendTag('')
      setNewWeekLabel(getWeekLabel())
      showMessage('success', 'New trend created and activated!')
      loadData()
    } catch (err) {
      showMessage('error', 'Failed to create trend.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTrendActive = async (trend: Trend) => {
    try {
      const db = getDb()
      if (!trend.active) {
        const batch = writeBatch(db)
        trends.forEach(t => {
          if (t.active) batch.update(doc(db, 'trends', t.id), { active: false })
        })
        await batch.commit()
      }
      await updateDoc(doc(db, 'trends', trend.id), { active: !trend.active })
      showMessage('success', `Trend ${trend.active ? 'deactivated' : 'activated'}.`)
      loadData()
    } catch (err) {
      showMessage('error', 'Failed to update trend.')
    }
  }

  const archiveTrend = async (trend: Trend) => {
    setArchivingTrendId(trend.id)
    try {
      const db = getDb()
      const trendVideos = videos.filter(v => v.trendId === trend.id)

      if (trendVideos.length === 0) {
        showMessage('error', 'No videos to archive for this trend.')
        return
      }

      const batch = writeBatch(db)

      const archiveRef = await addDoc(collection(db, 'archives'), {
        trendId: trend.id,
        trendTag: trend.tag,
        weekLabel: trend.weekLabel,
        videoIds: trendVideos.map(v => v.id),
        createdAt: serverTimestamp(),
      })

      trendVideos.forEach(v => {
        batch.update(doc(db, 'videos', v.id), {
          archived: true,
          archiveId: archiveRef.id,
        })
      })

      batch.update(doc(db, 'trends', trend.id), { active: false })
      await batch.commit()

      showMessage('success', `${trendVideos.length} videos archived successfully!`)
      loadData()
    } catch (err) {
      console.error('Archive failed:', err)
      showMessage('error', 'Failed to archive trend.')
    } finally {
      setArchivingTrendId(null)
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video permanently?')) return
    try {
      const db = getDb()
      await deleteDoc(doc(db, 'videos', videoId))
      showMessage('success', 'Video deleted.')
      loadData()
    } catch {
      showMessage('error', 'Failed to delete video.')
    }
  }

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete account "${user.identifier}" and ALL their videos? This cannot be undone.`)) return
    setDeletingUserId(user.id)
    try {
      const db = getDb()
      const batch = writeBatch(db)

      // Delete all videos by this channel
      const userVideos = videos.filter(v => v.channelId === user.channelId)
      userVideos.forEach(v => batch.delete(doc(db, 'videos', v.id)))

      // Delete likes for each video
      for (const v of userVideos) {
        const likesSnap = await getDocs(collection(db, 'videos', v.id, 'likes'))
        likesSnap.docs.forEach(l => batch.delete(doc(db, 'videos', v.id, 'likes', l.id)))
      }

      // Delete follows (as follower or following)
      const followsAsFollower = await getDocs(query(collection(db, 'follows'), where('followerId', '==', user.id)))
      const followsAsFollowing = await getDocs(query(collection(db, 'follows'), where('followingId', '==', user.id)))
      followsAsFollower.docs.forEach(f => batch.delete(doc(db, 'follows', f.id)))
      followsAsFollowing.docs.forEach(f => batch.delete(doc(db, 'follows', f.id)))

      // Delete channel
      batch.delete(doc(db, 'channels', user.channelId))

      // Delete user
      batch.delete(doc(db, 'users', user.id))

      await batch.commit()
      showMessage('success', `Account "${user.identifier}" and ${userVideos.length} videos deleted.`)
      loadData()
    } catch (err) {
      console.error('Delete user failed:', err)
      showMessage('error', 'Failed to delete account.')
    } finally {
      setDeletingUserId(null)
    }
  }

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'users', label: 'Users', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top bar */}
      <div className="glass border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="TrendLab Logo"
            className="w-10 h-10 object-contain drop-shadow-md opacity-40"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<div class="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center opacity-40"><span class="text-primary font-bold text-lg">T</span></div>')
            }}
          />
          <div>
            <h1 className="text-white font-bold text-sm">TrendLab Admin</h1>
            <p className="text-white/40 text-xs">Control Panel</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>

      {/* Message toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className={cn(
              'mx-4 mt-3 p-3 rounded-xl flex items-center gap-2 text-sm font-medium',
              message.type === 'success'
                ? 'bg-primary/15 border border-primary/30 text-primary-light'
                : 'bg-red-500/15 border border-red-500/30 text-red-400'
            )}
          >
            {message.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 mt-3 mx-4 gap-1 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all whitespace-nowrap',
              tab === id
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-white/50 hover:text-white'
            )}
          >
            <Icon size={14} />
            {label}
            {id === 'users' && users.length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                {users.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto pb-20">

        {/* TRENDS TAB */}
        {tab === 'trends' && (
          <div className="space-y-4">
            <div className="bg-surface-2 rounded-2xl p-4 border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Plus size={15} className="text-primary" />
                Create New Trend
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Trend Tag *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-lg">#</span>
                    <input
                      type="text"
                      placeholder="VLookupMaster"
                      value={newTrendTag}
                      onChange={e => setNewTrendTag(e.target.value.replace(/^#/, ''))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Week Label</label>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={newWeekLabel}
                      onChange={e => setNewWeekLabel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-white text-sm focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
                <button
                  onClick={createTrend}
                  disabled={!newTrendTag.trim() || isLoading}
                  className="w-full btn-primary py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    '🔥 Create & Activate Trend'
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2 px-1">
                All Trends ({trends.length})
              </h3>
              <div className="space-y-2">
                {trends.map(trend => (
                  <div key={trend.id} className="bg-surface-2 rounded-xl p-3 border border-white/10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">#{trend.tag}</span>
                          {trend.active && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-white/40 text-xs mt-0.5">{trend.weekLabel}</p>
                        <p className="text-white/30 text-xs">{trend.videoCount} videos</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => toggleTrendActive(trend)}
                          className={cn(
                            'p-2 rounded-lg text-xs transition-colors',
                            trend.active
                              ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          )}
                          title={trend.active ? 'Deactivate' : 'Activate'}
                        >
                          {trend.active ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => archiveTrend(trend)}
                          disabled={archivingTrendId === trend.id}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                          title="Archive this trend"
                        >
                          {archivingTrendId === trend.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Archive size={13} />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {trends.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-white/30">
                    <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No trends yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ARCHIVE TAB */}
        {tab === 'archive' && (
          <div className="space-y-3">
            <p className="text-white/40 text-xs px-1">
              Archive trends to move their videos out of the main feed
            </p>
            <div className="space-y-2">
              {trends.filter(t => t.videoCount && t.videoCount > 0).map(trend => (
                <div key={trend.id} className="bg-surface-2 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">#{trend.tag}</p>
                      <p className="text-white/40 text-xs mt-0.5">{trend.weekLabel} · {trend.videoCount} videos</p>
                    </div>
                    <button
                      onClick={() => archiveTrend(trend)}
                      disabled={archivingTrendId === trend.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {archivingTrendId === trend.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Archive size={12} />
                      }
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIDEOS TAB */}
        {tab === 'videos' && (
          <div className="space-y-2">
            <p className="text-white/40 text-xs px-1">{videos.length} total videos</p>
            {videos.map(video => (
              <div key={video.id} className="bg-surface-2 rounded-xl p-3 border border-white/10 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">#{video.trendTag}</p>
                  <p className="text-white/40 text-xs">
                    📺 {video.channelName || 'Unknown'} · ❤️ {video.likes}
                  </p>
                </div>
                <button
                  onClick={() => deleteVideo(video.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {videos.length === 0 && (
              <div className="text-center py-12 text-white/30">
                <Video size={40} className="mx-auto mb-2 opacity-30" />
                <p>No videos yet</p>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="space-y-2">
            <p className="text-white/40 text-xs px-1">{users.length} registered accounts</p>
            {users.map(user => (
              <div key={user.id} className="bg-surface-2 rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      user.type === 'individual' ? 'bg-primary/10' : 'bg-blue-500/10'
                    )}>
                      {user.type === 'individual'
                        ? <User size={16} className="text-primary" />
                        : <Users size={16} className="text-blue-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">@{user.identifier}</span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                          user.type === 'individual'
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        )}>
                          {user.type}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs truncate">
                        📺 {user.channelName} · 🎬 {user.videoCount} reels
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteUser(user)}
                    disabled={deletingUserId === user.id}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0 disabled:opacity-50"
                    title="Delete account and all videos"
                  >
                    {deletingUserId === user.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-12 text-white/30">
                <Users size={40} className="mx-auto mb-2 opacity-30" />
                <p>No registered accounts yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
