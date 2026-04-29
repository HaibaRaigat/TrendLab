const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // أضفنا Cloudinary لضمان عمل الصور والفيديوهات من المصدرين
    domains: ['firebasestorage.googleapis.com', 'res.cloudinary.com'],
  },
  experimental: {
    serverActions: {},
  },
}

module.exports = withPWA(nextConfig)
