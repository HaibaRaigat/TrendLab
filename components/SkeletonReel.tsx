'use client'

export default function SkeletonReel() {
  return (
    <div className="reel-item relative bg-surface-3 overflow-hidden">
      {/* Video skeleton */}
      <div className="absolute inset-0 shimmer" />

      {/* Top bar skeleton */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg shimmer" />
          <div className="w-20 h-4 rounded shimmer" />
        </div>
        <div className="w-9 h-9 rounded-full shimmer" />
      </div>

      {/* Right sidebar skeleton */}
      <div className="absolute right-4 bottom-28 z-20 flex flex-col items-center gap-5">
        <div className="w-12 h-12 rounded-full shimmer" />
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full shimmer" />
          <div className="w-8 h-3 rounded shimmer" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full shimmer" />
          <div className="w-8 h-3 rounded shimmer" />
        </div>
      </div>

      {/* Bottom info skeleton */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6">
        <div className="w-24 h-6 rounded-full shimmer mb-3" />
        <div className="w-36 h-5 rounded shimmer mb-2" />
        <div className="w-56 h-4 rounded shimmer mb-1" />
        <div className="w-44 h-4 rounded shimmer mb-2" />
        <div className="w-16 h-3 rounded shimmer" />
        <div className="mt-3 h-0.5 rounded-full shimmer" />
      </div>
    </div>
  )
}
