'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame,
  BarChart3,
  Map,
  Cpu,
  Settings,
  Activity,
  Cloud,
  AlertTriangle,
  Target,
  Zap,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  FileText,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavigationItem[]
}

interface SidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

// --- NAVIGATION DATA ---
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    id: 'prediction',
    label: 'Fire Prediction',
    href: '/prediction',
    icon: Flame,
    children: [
      {
        id: 'real-time',
        label: 'Real-time Analysis',
        href: '/prediction/real-time',
        icon: Activity
      },
      {
        id: 'historical',
        label: 'Historical Data',
        href: '/prediction/historical',
        icon: Database
      },
      {
        id: 'alerts',
        label: 'Risk Alerts',
        href: '/prediction/alerts',
        icon: AlertTriangle,
        badge: 3
      }
    ]
  },
  {
    id: 'quantum',
    label: 'Quantum Computing',
    href: '/quantum',
    icon: Cpu,
    children: [
      {
        id: 'circuits',
        label: 'Circuit Builder',
        href: '/quantum/circuits',
        icon: Zap
      },
      {
        id: 'classiq',
        label: 'Classiq Platform',
        href: '/classiq',
        icon: Cloud
      },
      {
        id: 'hardware',
        label: 'Hardware Access',
        href: '/quantum/hardware',
        icon: Monitor
      }
    ]
  },
  {
    id: 'visualization',
    label: 'Visualization',
    href: '/visualization',
    icon: BarChart3,
    children: [
      {
        id: 'maps',
        label: 'Fire Maps',
        href: '/visualization/maps',
        icon: Map
      },
      {
        id: '3d',
        label: '3D Simulation',
        href: '/visualization/3d',
        icon: Target
      },
      {
        id: 'paradise-demo',
        label: 'Paradise Fire Demo',
        href: '/demo/paradise-fire',
        icon: Flame
      }
    ]
  },
  {
    id: 'data',
    label: 'Data Sources',
    href: '/data',
    icon: Database,
    children: [
      {
        id: 'nasa-firms',
        label: 'NASA FIRMS',
        href: '/data/nasa-firms',
        icon: Activity
      },
      {
        id: 'weather',
        label: 'Weather Data',
        href: '/data/weather',
        icon: Cloud
      },
      {
        id: 'terrain',
        label: 'Terrain Analysis',
        href: '/data/terrain',
        icon: Map
      }
    ]
  },
  {
    id: 'documentation',
    label: 'Documentation',
    href: '/docs',
    icon: FileText
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

// --- COMPONENTS ---

// Navigation Item Component
function NavigationItem({ 
  item, 
  isActive, 
  isCollapsed, 
  level = 0 
}: { 
  item: NavigationItem, 
  isActive: boolean, 
  isCollapsed: boolean, 
  level?: number 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const pathname = usePathname()
  
  // Check if any child is active
  const isParentActive = item.children?.some(child => pathname === child.href) || false
  const shouldExpand = isParentActive || isExpanded
  
  React.useEffect(() => {
    if (isParentActive && !isCollapsed) {
      setIsExpanded(true)
    }
  }, [isParentActive, isCollapsed])
  
  const handleClick = () => {
    if (hasChildren && !isCollapsed) {
      setIsExpanded(!isExpanded)
    }
  }
  
  const Icon = item.icon
  
  return (
    <div>
      {hasChildren ? (
        <button
          onClick={handleClick}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
            level > 0 && "ml-4",
            isActive || isParentActive
              ? "bg-purple-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          )}
        >
          <Icon className={cn("w-5 h-5 flex-shrink-0", isCollapsed && "mx-auto")} />
          
          {!isCollapsed && (
            <>
              <span className="font-medium flex-1 text-left">{item.label}</span>
              
              {item.badge && (
                <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
              
              <motion.div
                animate={{ rotate: shouldExpand ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </>
          )}
        </button>
      ) : (
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
            level > 0 && "ml-4",
            isActive
              ? "bg-purple-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          )}
        >
          <Icon className={cn("w-5 h-5 flex-shrink-0", isCollapsed && "mx-auto")} />
          
          {!isCollapsed && (
            <>
              <span className="font-medium flex-1">{item.label}</span>
              
              {item.badge && (
                <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </Link>
      )}
      
      {/* Children */}
      <AnimatePresence>
        {hasChildren && shouldExpand && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1">
              {item.children?.map((child) => (
                <NavigationItem
                  key={child.id}
                  item={child}
                  isActive={pathname === child.href}
                  isCollapsed={isCollapsed}
                  level={level + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- MAIN COMPONENT ---
export function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  className
}: SidebarProps) {
  const pathname = usePathname()
  
  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        "bg-gray-900 border-r border-gray-800 flex flex-col h-full",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">QuantumFire</h1>
                <p className="text-xs text-gray-400">Prediction Platform</p>
              </div>
            </motion.div>
          )}
          
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mx-auto">
              <Flame className="w-5 h-5 text-white" />
            </div>
          )}
          
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        {!isCollapsed ? (
          <div className="text-xs text-gray-500 space-y-1">
            <div>Quantum Fire Prediction Platform</div>
            <div>Version 2.0.0</div>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Quantum systems online</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  )
}