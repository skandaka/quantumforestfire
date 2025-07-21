import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface AlertBannerProps {
  type: 'info' | 'warning' | 'critical'
  message: string
  action?: {
    label: string
    href: string
  }
  dismissible?: boolean
}

export function AlertBanner({
  type,
  message,
  action,
  dismissible = true
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className={cn(
      'relative px-6 py-4 border-l-4',
      type === 'critical' && 'bg-red-950/50 border-red-500 text-red-200',
      type === 'warning' && 'bg-orange-950/50 border-orange-500 text-orange-200',
      type === 'info' && 'bg-blue-950/50 border-blue-500 text-blue-200'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{message}</p>
          {action && (
            <Link
              href={action.href}
              className="ml-4 text-sm font-semibold underline hover:no-underline"
            >
              {action.label}
            </Link>
          )}
        </div>

        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}