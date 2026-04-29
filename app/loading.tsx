export default function Loading() {
  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="loading-dot w-1.5 h-1.5 rounded-full bg-primary/60"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
