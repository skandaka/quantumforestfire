'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Activity, AlertTriangle, Cpu, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useQuantumPrediction } from '@/hooks/useQuantumPrediction'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Activity },
  { name: 'Paradise Demo', href: '/demo/paradise-fire', icon: AlertTriangle },
  { name: 'Quantum Tech', href: '/classiq', icon: Cpu },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { systemStatus } = useQuantumPrediction()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
      <header className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'bg-black/80 backdrop-blur-lg border-b border-gray-800' : 'bg-transparent'
      )}>
        <nav className="mx-auto max-w-7xl px-4 lg:px-8" aria-label="Top">
          <div className="flex w-full items-center justify-between py-3 gap-4">
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative">
                <Flame className="h-8 w-8 text-red-500 transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-red-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              </div>
              <span className="text-xl font-bold whitespace-nowrap">
              Quantum<span className="text-red-500">Fire</span>
            </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            'relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg',
                            isActive
                                ? 'text-red-500 bg-red-500/10'
                                : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                        )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.name}</span>
                      {isActive && (
                          <motion.div
                              layoutId="nav-indicator"
                              className="absolute inset-x-0 -bottom-px h-px bg-red-500 rounded-full"
                          />
                      )}
                    </Link>
                )
              })}
            </div>

            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm">
                <div className={cn(
                    'h-2 w-2 rounded-full',
                    systemStatus === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
                )} />
                <span className="text-gray-400 whitespace-nowrap">
                {systemStatus === 'operational' ? 'System Active' : 'Limited'}
              </span>
              </div>
              <Link href="/dashboard">
                <Button size="sm" className="quantum-glow-sm whitespace-nowrap">
                  Launch App
                </Button>
              </Link>
            </div>

            <button
                type="button"
                className="md:hidden p-2 text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
              ) : (
                  <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {mobileMenuOpen && (
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden bg-black/95 backdrop-blur-lg border-t border-gray-800"
              >
                <div className="px-6 py-4 space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 text-base font-medium rounded-lg transition-colors',
                                isActive
                                    ? 'bg-red-500/20 text-red-500'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                            )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                    )
                  })}
                  <div className="pt-4 border-t border-gray-800">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">
                        Launch Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </header>
  )
}