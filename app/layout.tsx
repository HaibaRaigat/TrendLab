import type { Metadata, Viewport } from 'next'
import SplashScreen from '@/components/SplashScreen'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'TrendLab — Excel Skills Reels',
  description: 'Plateforme de partage de compétences Excel — BMO Program · ISTA NTIC Guelmim',
  keywords: 'Excel, formation, ISTA, BMO, Guelmim, reels, compétences',
  
  // 1. التغيير هنا: الموقع أعطاك ملفاً باسم site.webmanifest وليس manifest.json
  manifest: '/site.webmanifest', 

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TrendLab',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },

  // 2. إضافة الأيقونات الجديدة لضمان ظهورها بشكل احترافي
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  openGraph: {
    title: 'TrendLab — Excel Skills Reels',
    description: 'Discover Excel skills through short vertical reels',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a', // لون الخلفية السوداء الفخم لمنصتك
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <SplashScreen />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}