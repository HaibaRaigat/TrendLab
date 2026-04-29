import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-5">🎬</div>
      <h1 className="text-white font-bold text-3xl mb-2">404</h1>
      <p className="text-white/40 text-sm mb-8">This page doesn&apos;t exist</p>
      <Link
        href="/"
        className="btn-primary px-8 py-3 rounded-xl font-semibold text-white text-sm inline-block"
      >
        ← Back to Feed
      </Link>
    </div>
  )
}
