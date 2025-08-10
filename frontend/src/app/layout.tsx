'use client'

import { Inter } from 'next/font/google'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame,
  Activity,
  AlertTriangle,
  Cpu,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useQuantumPrediction } from '@/hooks/useQuantumPrediction'
import './globals.css'

// --- FONT CONFIGURATION ---
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// --- NAVIGATION ITEMS ---
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Paradise Demo', href: '/demo/paradise-fire', icon: AlertTriangle },
  { name: 'Quantum Tech', href: '/classiq', icon: Cpu },
]

// --- HEADER COMPONENT IMPLEMENTATION ---
// This is a sophisticated, responsive header component integrated directly
// into the root layout for maximum cohesion.

function Header() {
  const pathname = usePathname()
  const { systemStatus } = useQuantumPrediction()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHoverZone, setIsHoverZone] = useState(false)
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Scroll + hover logic for auto-hide
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setIsScrolled(y > 10)
      if (y < 10) {
        setVisible(true)
      } else {
        if (y > lastScrollY + 20 && !isHoverZone && !mobileMenuOpen) {
          setVisible(false)
        } else if (y < lastScrollY - 20) {
          setVisible(true)
        }
      }
      setLastScrollY(y)
    }
    const handlePointer = (e: PointerEvent) => {
      if (e.clientY < 80) {
        setIsHoverZone(true)
        setVisible(true)
      } else {
        setIsHoverZone(false)
        if (window.scrollY > 120 && !mobileMenuOpen) setVisible(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pointermove', handlePointer, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('pointermove', handlePointer)
    }
  }, [lastScrollY, isHoverZone, mobileMenuOpen])

  // Close mobile menu on route change
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false)
    }
  }, [pathname])

  const isHomePage = pathname === '/'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out',
        isScrolled || !isHomePage
          ? 'bg-black/70 backdrop-blur-xl border-b border-gray-800/60 shadow-lg shadow-black/40'
          : 'bg-gradient-to-b from-black/60 to-transparent border-b border-transparent',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
    >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <Flame className="h-8 w-8 text-red-500 transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-red-500/50 blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                </div>
                <span className="text-2xl font-bold whitespace-nowrap">
                Quantum<span className="text-red-500">Fire</span>
              </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-2">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                            'hover:text-white hover:bg-gray-800/50',
                            isActive ? 'text-white' : 'text-gray-400'
                        )}
                    >
                      <item.icon
                          className={cn(
                              'h-4 w-4 flex-shrink-0',
                              isActive ? 'text-red-400' : 'text-gray-500'
                          )}
                      />
                      <span>{item.name}</span>
                      {isActive && (
                          <motion.div
                              layoutId="desktop-nav-indicator"
                              className="absolute inset-x-2 -bottom-2 h-0.5 bg-red-500 rounded-full"
                          />
                      )}
                    </Link>
                )
              })}
            </div>

            {/* Desktop Right Side Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div
                    className={cn('h-2.5 w-2.5 rounded-full transition-colors', {
                      'bg-green-500 animate-pulse': systemStatus === 'operational',
                      'bg-yellow-500': systemStatus === 'degraded',
                      'bg-red-500': systemStatus === 'offline',
                    })}
                />
                <span className="text-gray-300 capitalize">{systemStatus}</span>
              </div>
              <Link href="/dashboard">
                <Button size="sm" className="quantum-glow">
                  Launch Dashboard
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="lg:hidden fixed inset-0 z-50"
              >
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setMobileMenuOpen(false)}
                />

                {/* Menu Content */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: '0%' }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute top-0 right-0 h-full w-full max-w-xs bg-gray-900 shadow-xl p-6 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2">
                      <Flame className="h-7 w-7 text-red-500" />
                      <span className="text-xl font-bold">
                    Quantum<span className="text-red-500">Fire</span>
                  </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 -m-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {navigation.map((item) => {
                      const isActive = pathname.startsWith(item.href)
                      return (
                          <Link
                              key={item.name}
                              href={item.href}
                              className={cn(
                                  'flex items-center gap-3 px-3 py-3 text-base font-medium rounded-lg transition-colors',
                                  isActive
                                      ? 'bg-red-500/20 text-red-400'
                                      : 'text-gray-300 hover:bg-gray-800'
                              )}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </Link>
                      )
                    })}
                  </div>

                  <div className="mt-auto pt-6 border-t border-gray-700 space-y-4">
                    <div className="flex items-center gap-2 text-sm justify-center">
                      <div
                          className={cn('h-2.5 w-2.5 rounded-full', {
                            'bg-green-500': systemStatus === 'operational',
                            'bg-yellow-500': systemStatus === 'degraded',
                          })}
                      />
                      <span className="text-gray-400">System: {systemStatus}</span>
                    </div>
                    <Button asChild size="lg" className="w-full">
                      <Link href="/dashboard">
                        Launch Dashboard
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </header>
  )
}


// --- ROOT LAYOUT COMPONENT ---
export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="en" className={cn('dark', inter.variable)}>
      <head>
        {/* Standard metadata can go here */}
      </head>
      <body className="bg-black font-sans antialiased">
      {/* --- GLOBAL TOASTER PROVIDER --- */}
      <Toaster
          position="bottom-right"
          toastOptions={{
            className: '',
            style: {
              background: '#1f2937', // gray-800
              color: '#f3f4f6', // gray-100
              border: '1px solid #4b5563', // gray-600
            },
            success: {
              iconTheme: {
                primary: '#22c55e', // green-500
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444', // red-500
                secondary: 'white',
              },
            },
          }}
      />

      {/* The Header is rendered on every page */}
      <Header />

  {/* Offset main content so fixed header (h-20) doesn't overlap */}
  <main className="pt-24">{children}</main>
      </body>
      </html>
  )
}