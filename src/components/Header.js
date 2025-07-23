'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  if (!session) return null

  // Get role-specific dashboard URL
  const getDashboardUrl = () => {
    switch (session.user.role) {
      case 'security_supervisor':
        return '/supervisor-dashboard'
      case 'maintenance':
        return '/maintenance-dashboard'
      case 'management':
        return '/management-dashboard'
      default:
        return '/dashboard'
    }
  }

  // Get role display name
  const getRoleDisplay = () => {
    switch (session.user.role) {
      case 'security_supervisor':
        return 'Security Supervisor'
      case 'maintenance':
        return 'Maintenance Team'
      case 'management':
        return 'Management'
      case 'guard':
        return 'Security Guard'
      default:
        return session.user.role
    }
  }

  // Get role color
  const getRoleColor = () => {
    switch (session.user.role) {
      case 'security_supervisor':
        return 'bg-purple-100 text-purple-800'
      case 'maintenance':
        return 'bg-green-100 text-green-800'
      case 'management':
        return 'bg-blue-100 text-blue-800'
      case 'guard':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Navigation items based on role
  const getNavigationItems = () => {
    const items = []

    // Dashboard (always available)
    items.push({
      name: 'Dashboard',
      href: getDashboardUrl(),
      icon: '🏠',
      active: pathname === getDashboardUrl()
    })

    if (session.user.role === 'guard') {
      // Guard-specific navigation
      items.push(
        {
          name: 'Report Incident',
          href: '/incidents/new',
          icon: '🚨',
          active: pathname === '/incidents/new'
        },
        {
          name: 'My Reports',
          href: '/incidents',
          icon: '📋',
          active: pathname.startsWith('/incidents') && pathname !== '/incidents/new'
        },
        {
          name: 'Check In/Out',
          href: '/checkin',
          icon: '📍',
          active: pathname === '/checkin'
        },
        {
          name: 'Clients',
          href: '/clients',
          icon: '🏢',
          active: pathname === '/clients'
        }
      )
    } else if (session.user.role === 'security_supervisor') {
      // Supervisor-specific navigation
      items.push(
        {
          name: 'Messages',
          href: '/supervisor/messages',
          icon: '📨',
          active: pathname.startsWith('/supervisor/messages')
        },
        {
          name: 'All Reports',
          href: '/supervisor/reports',
          icon: '📊',
          active: pathname.startsWith('/supervisor/reports')
        },
        {
          name: 'Guard Management',
          href: '/supervisor/guards',
          icon: '👥',
          active: pathname.startsWith('/supervisor/guards')
        }
      )
    } else if (session.user.role === 'maintenance') {
      // Maintenance-specific navigation
      items.push(
        {
          name: 'Work Orders',
          href: '/maintenance/orders',
          icon: '🔧',
          active: pathname.startsWith('/maintenance/orders')
        },
        {
          name: 'Messages',
          href: '/maintenance/messages',
          icon: '📨',
          active: pathname.startsWith('/maintenance/messages')
        }
      )
    } else if (session.user.role === 'management') {
      // Management-specific navigation
      items.push(
        {
          name: 'Overview',
          href: '/management/overview',
          icon: '📈',
          active: pathname.startsWith('/management/overview')
        },
        {
          name: 'Reports',
          href: '/management/reports',
          icon: '📊',
          active: pathname.startsWith('/management/reports')
        },
        {
          name: 'Messages',
          href: '/management/messages',
          icon: '📨',
          active: pathname.startsWith('/management/messages')
        }
      )
    }

    return items
  }

  const navigationItems = getNavigationItems()

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={() => router.push(getDashboardUrl())}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IR</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">IRPA System</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Incident Reporting & Management</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Notifications (placeholder) */}
            <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.01-3.01c-.24-.24-.24-.66 0-.9l3.01-3.01V5a2 2 0 00-2-2H6a2 2 0 00-2 2v5.08l3.01 3.01c.24.24.24.66 0 .9L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>

            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor()}`}>
                {getRoleDisplay()}
              </span>
            </div>

            {/* Profile Avatar */}
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {session.user.name?.charAt(0)?.toUpperCase() || '👤'}
              </span>
            </div>

            {/* Sign Out */}
            <button
              onClick={() => signOut()}
              className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href)
                    setShowMobileMenu(false)
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium text-left transition-colors ${
                    item.active
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>
            
            {/* Mobile User Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 sm:hidden">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
                <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor()}`}>
                  {getRoleDisplay()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}