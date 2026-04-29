'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, query, orderBy, limit, startAfter, getDocs, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { VideoWithChannel, Video, Channel } from '@/types'
import VideoReel from './VideoReel'
import SkeletonReel from './SkeletonReel'

const PAGE_SIZE = 5

export default function ReelsContainer() {
  const [videos, setVideos] = useState<VideoWithChannel[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const channelCache = useRef<Map<string, Channel>>(new Map())

  const fetchChannel = useCallback(async (channelId: string): Promise<Channel | undefined> => {
    if (channelCache.current.has(channelId)) {
      return channelCache.current.get(channelId)
    }
    try {
      const db = getDb()
      const { doc, getDoc } = await import('firebase/firestore')
      const channelDoc = await getDoc(doc(db, 'channels', channelId))
      if (channelDoc.exists()) {
        const channel = { id: channelDoc.id, ...channelDoc.data() } as Channel
        channelCache.current.set(channelId, channel)
        return channel
      }
    } catch (err) {
      console.error('Failed to fetch channel:', err)
    }
    return undefined
  }, [])

  const enrichVideos = useCallback(async (rawVideos: Video[]): Promise<VideoWithChannel[]> => {
    const enriched = await Promise.all(
      rawVideos.map(async (video) => ({
        ...video,
        channel: await fetchChannel(video.channelId),
      }))
    )
    return enriched
  }, [fetchChannel])

  const loadVideos = useCallback(async (isInitial = false) => {
    if (!hasMore && !isInitial) return
    setIsLoading(true)

    try {
      const db = getDb()
      const videosRef = collection(db, 'videos')
      
      let q = query(
        videosRef,
        orderBy('likes', 'desc'),
        orderBy('timestamp', 'desc'),
        limit(PAGE_SIZE)
      )

      if (!isInitial && lastDoc) {
        q = query(
          videosRef,
          orderBy('likes', 'desc'),
          orderBy('timestamp', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        )
      }

      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        setHasMore(false)
        setIsLoading(false)
        return
      }

      const rawVideos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Video[]

      const enriched = await enrichVideos(rawVideos)

      if (isInitial) {
        setVideos(enriched)
      } else {
        setVideos(prev => [...prev, ...enriched])
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (err) {
      console.error('Failed to load videos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [hasMore, lastDoc, enrichVideos])

  // Initial load
  useEffect(() => {
    loadVideos(true)
  }, [])

  // Intersection Observer for active reel detection
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setActiveIndex(index)

            // Load more when near the end
            if (index >= videos.length - 2 && hasMore && !isLoading) {
              loadVideos()
            }
          }
        })
      },
      {
        root: container,
        threshold: 0.5,
      }
    )

    const reels = container.querySelectorAll('.reel-item[data-index]')
    reels.forEach(reel => observerRef.current?.observe(reel))

    return () => observerRef.current?.disconnect()
  }, [videos.length, hasMore, isLoading])

  if (isLoading && videos.length === 0) {
    return (
      <div className="reels-container" ref={containerRef}>
        {[0, 1, 2].map(i => <SkeletonReel key={i} />)}
      </div>
    )
  }

  if (!isLoading && videos.length === 0) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-surface gap-4">
        <div className="text-6xl">🎬</div>
        <h2 className="text-white font-bold text-xl">No videos yet</h2>
        <p className="text-white/50 text-sm text-center px-8">
          Be the first to share your Excel skills!
        </p>
      </div>
    )
  }

  return (
    <div className="reels-container" ref={containerRef}>
      {videos.map((video, index) => (
        <div key={video.id} data-index={index} className="reel-item">
          <VideoReel
            video={video}
            isActive={activeIndex === index}
            index={index}
          />
        </div>
      ))}

      {/* Loading more */}
      {isLoading && videos.length > 0 && (
        <div className="reel-item flex items-center justify-center bg-surface">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-white/50 text-sm">Loading more...</span>
          </div>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && videos.length > 0 && (
        <div className="reel-item flex items-center justify-center bg-surface">
          <div className="text-center px-8">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-white font-bold text-lg">That's all for now!</h3>
            <p className="text-white/50 text-sm mt-2">
              Check back later for more Excel reels
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
