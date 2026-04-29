import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatLikes(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count.toString()
}

export function formatDate(date: Date | { seconds: number; nanoseconds: number }): string {
  const d = date instanceof Date ? date : new Date(date.seconds * 1000)
  return d.toLocaleDateString('fr-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function timeAgo(date: Date | { seconds: number; nanoseconds: number }): string {
  const d = date instanceof Date ? date : new Date(date.seconds * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(diff / 604800000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return `${weeks}w ago`
}

export function getWeekLabel(): string {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const format = (d: Date) => d.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })
  return `Week ${format(start)} - ${format(end)}`
}

export async function downloadVideo(url: string, filename: string): Promise<void> {
  // تحويل رابط Cloudinary ليصبح رابط تحميل مباشر
  let finalUrl = url;
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    finalUrl = url.replace('/upload/', '/upload/fl_attachment/');
  }

  // استخدام المتصفح مباشرة (بدون انتظار fetch الذي يعلق النظام مع الملفات الكبيرة)
  const a = document.createElement('a');
  a.href = finalUrl;
  a.download = filename || 'trendlab-video.mp4';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
