'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

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

  // Get role color with gradient
  const getRoleGradient = () => {
    switch (session.user.role) {
      case 'security_supervisor':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 'maintenance':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 'management':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'guard':
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
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
          name: 'My Reports',
          href: '/incidents',
          icon: '📋',
          active: pathname.startsWith('/incidents') && pathname !== '/incidents/new'
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
        // {
        //   name: 'All Reports',
        //   href: '/supervisor/reports',
        //   icon: '📊',
        //   active: pathname.startsWith('/supervisor/reports')
        // },
        // {
        //   name: 'Guard Management',
        //   href: '/supervisor/guards',
        //   icon: '👥',
        //   active: pathname.startsWith('/supervisor/guards')
        // },
        {
          name: 'Add Client',
          href: '/clients',
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
    <header className="bg-white shadow-lg border-b sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={() => router.push(getDashboardUrl())}
              className="flex items-center space-x-4 hover:opacity-80 transition-all duration-200 group"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
                  <span className="text-white font-bold text-lg">IR</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-xl opacity-20 blur-sm"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  IRPA System
                </h1>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  item.active
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform -translate-y-0.5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-base mr-2">{item.icon}</span>
                <span>{item.name}</span>
                {item.active && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-20 blur-sm"></div>
                )}
              </button>
            ))}
          </nav>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              >
                {/* User Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <span className="text-gray-700 font-bold text-lg">
                      {session.user.name?.charAt(0)?.toUpperCase() || '👤'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                </div>

                {/* User Info - Desktop */}
                <div className="hidden xl:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.email}</p>
                </div>

                {/* Role Badge */}
                <span className={`hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-bold shadow-md ${getRoleGradient()}`}>
                  {getRoleDisplay()}
                </span>

                {/* Dropdown Arrow */}
                <svg className="w-4 h-4 text-gray-400 transform group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                    <span className={`inline-flex mt-2 px-2 py-1 rounded-lg text-xs font-bold ${getRoleGradient()}`}>
                      {getRoleDisplay()}
                    </span>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        router.push('/profile')
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <span>👤</span>
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        signOut()
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 py-4 bg-gray-50/80 backdrop-blur-sm rounded-b-xl">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href)
                    setShowMobileMenu(false)
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all duration-200 mx-2 ${
                    item.active
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <span className="text-base mr-3">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>
            
            {/* Mobile User Info */}
            <div className="mt-6 pt-4 border-t border-gray-200 mx-2">
              <div className="flex items-center space-x-3 px-4 py-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center">
                  <span className="text-gray-700 font-bold">
                    {session.user.name?.charAt(0)?.toUpperCase() || '👤'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.email}</p>
                  <span className={`inline-flex mt-1 px-2 py-1 rounded-lg text-xs font-bold ${getRoleGradient()}`}>
                    {getRoleDisplay()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl mx-2 mt-2 flex items-center space-x-2"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false)
            setShowMobileMenu(false)
          }}
        />
      )}
    </header>
  )
}