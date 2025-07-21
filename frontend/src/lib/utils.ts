import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatPercent(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs.toFixed(0)}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine formula for distance in km
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export function getRiskLevel(probability: number): {
  level: 'low' | 'medium' | 'high' | 'extreme'
  color: string
  bgColor: string
} {
  if (probability >= 0.8) {
    return { level: 'extreme', color: 'text-red-500', bgColor: 'bg-red-500/20' }
  } else if (probability >= 0.6) {
    return { level: 'high', color: 'text-orange-500', bgColor: 'bg-orange-500/20' }
  } else if (probability >= 0.3) {
    return { level: 'medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' }
  } else {
    return { level: 'low', color: 'text-green-500', bgColor: 'bg-green-500/20' }
  }
}

export function generateFireIntensityColor(intensity: number): string {
  // 0 = no fire (transparent), 1 = extreme fire (white hot)
  if (intensity <= 0) return 'rgba(0, 0, 0, 0)'

  if (intensity < 0.2) {
    // Low intensity - dark red
    return `rgba(139, 0, 0, ${intensity * 5})`
  } else if (intensity < 0.4) {
    // Medium-low - red
    return `rgba(255, 0, 0, ${0.6 + intensity})`
  } else if (intensity < 0.6) {
    // Medium - orange
    return `rgba(255, 140, 0, ${0.7 + intensity * 0.5})`
  } else if (intensity < 0.8) {
    // High - yellow-orange
    return `rgba(255, 215, 0, ${0.8 + intensity * 0.25})`
  } else {
    // Extreme - white hot
    const white = (intensity - 0.8) * 5
    return `rgba(255, 255, ${200 + white * 55}, ${0.9 + intensity * 0.1})`
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}