'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Archive, Upload, Shield, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'Explore' },
  { href: '/archives', icon: Archive, label: 'Archives' },
  { href: '/upload', icon: Upload, label: 'Upload' },
]

export default function Navigation() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  if (pathname.startsWith('/admin')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-auto">
          <div className="glass-dark border-t border-white/10 md:border md:rounded-2xl md:shadow-2xl">
            <div className="flex items-center justify-around px-2 py-2 md:px-4 md:gap-2">
              {navItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href
                return (
                  <Link key={href} href={href}>
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        'flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200',
                        isActive
                          ? 'text-primary'
                          : 'text-white/50 hover:text-white/80'
                      )}
                    >
                      <div className="relative">
                        {isActive && (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute inset-0 bg-primary/20 rounded-lg -m-1"
                          />
                        )}
                        <Icon
                          size={22}
                          className={cn(
                            'relative z-10 transition-all',
                            isActive && 'drop-shadow-[0_0_8px_rgba(73,165,70,0.8)]'
                          )}
                          strokeWidth={isActive ? 2.5 : 1.8}
                        />
                      </div>
                      <span className={cn(
                        'text-[10px] font-medium tracking-wide transition-all',
                        isActive ? 'opacity-100' : 'opacity-60'
                      )}>
                        {label}
                      </span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
            {/* Safe area spacer for iOS */}
            <div className="h-safe-bottom md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
          </div>
    </nav>
  )
}
