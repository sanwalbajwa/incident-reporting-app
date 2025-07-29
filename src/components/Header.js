'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { 
  Home, 
  FileText, 
  Building2, 
  Users, 
  BarChart3, 
  Mail, 
  TrendingUp,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  Shield,
  Crown,
  UserCheck
} from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  // Refs for click outside detection
  const mobileMenuRef = useRef(null)
  const userMenuRef = useRef(null)

  // Close menus when route changes
  useEffect(() => {
    setShowMobileMenu(false)
    setShowUserMenu(false)
  }, [pathname])

  // Handle click outside to close menus
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    if (showMobileMenu || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileMenu, showUserMenu])
  if (!session) return null
  // Get role-specific dashboard URL
  const getDashboardUrl = () => {
    switch (session.user.role) {
      case 'security_supervisor':
        return '/supervisor-dashboard'
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
      case 'management':
        return 'Management'
      case 'guard':
        return 'Security Guard'
      case 'rover':
        return 'Rover'
      default:
        return session.user.role
    }
  }

  // Get role icon
  const getRoleIcon = () => {
    switch (session.user.role) {
      case 'security_supervisor':
        return <Shield className="w-4 h-4" />
      case 'management':
        return <Crown className="w-4 h-4" />
      case 'guard':
        return <UserCheck className="w-4 h-4" />
      case 'rover':
        return <UserCheck className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  // Get role color with gradient
  const getRoleGradient = () => {
    switch (session.user.role) {
      case 'security_supervisor':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 'management':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'guard':
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
      case 'rover':
        return 'bg-gradient-to-r from-green-600 to-green-700 text-white'
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
    }
  }

  // Navigation items based on role
  const getNavigationItems = () => {
    const items = []

    if (session.user.role === 'guard' || session.user.role === 'rover') {
    // Guard and Rover-specific navigation
    items.push(
      {
        name: 'My Reports',
        href: '/incidents',
        icon: FileText,
        active: pathname.startsWith('/incidents') && pathname !== '/incidents/new'
      },
      {
        name: 'Clients',
        href: '/clients',
        icon: Building2,
        active: pathname === '/clients'
      }
    )
  } else if (session.user.role === 'security_supervisor') {
      // Supervisor-specific navigation
      items.push(
        {
          name: 'Guards & Rovers',
          href: '/supervisor/guards',
          icon: Users,
          active: pathname.startsWith('/supervisor/guards')
        },
        {
          name: 'Clients',
          href: '/clients',
          icon: Building2,
          active: pathname === '/clients'
        }
      )
    } else if (session.user.role === 'management') {
      // Management-specific navigation
      items.push(
        {
          name: 'Guards & Rovers',
          href: '/management/guards',
          icon: Users,
          active: pathname.startsWith('/management/guards')
        },
        {
          name: 'Supervisors', 
          href: '/management/supervisors',
          icon: Shield,
          active: pathname.startsWith('/management/supervisors')
        },
        {
          name: 'Clients',
          href: '/clients',
          icon: Building2,
          active: pathname === '/clients'
        },
        {
          name: 'All Reports',
          href: '/management/reports',
          icon: BarChart3,
          active: pathname.startsWith('/management/reports')
        }
      )
    }

    return items
  }

  const navigationItems = getNavigationItems()

  // Handle navigation with proper menu closing
  const handleNavigation = (href) => {
    setShowMobileMenu(false)
    setShowUserMenu(false)
    router.push(href)
  }

  const handleSignOut = () => {
    setShowUserMenu(false)
    setShowMobileMenu(false)
    signOut()
  }

  return (
    <header className="bg-white shadow-lg border-b sticky top-0 z-50 backdrop-blur-md bg-white/95 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo and Brand */}
          <div className="flex items-center py-4">
            <button
              onClick={() => handleNavigation(getDashboardUrl())}
              className="flex items-center space-x-4 hover:opacity-80 transition-all duration-200 group"
            >
              {/* Circular Logo */}
              <div className="w-24 h-24 relative rounded-full overflow-hidden transform group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/smile-4-life.png"
                  alt="IRPA Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  Smile 4 Life
                </h1>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group flex items-center space-x-2 ${
                    item.active
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform -translate-y-0.5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.active && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-20 blur-sm"></div>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              >
                {/* User Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <span className="text-gray-700 font-bold text-lg">
                      {session.user.name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
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
                <span className={`hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md ${getRoleGradient()}`}>
                  {getRoleIcon()}
                  <span>{getRoleDisplay()}</span>
                </span>

                {/* Dropdown Arrow */}
                <ChevronDown className="w-4 h-4 text-gray-400 transform group-hover:rotate-180 transition-transform duration-200" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                    <span className={`inline-flex items-center space-x-1 mt-2 px-2 py-1 rounded-lg text-xs font-bold ${getRoleGradient()}`}>
                      {getRoleIcon()}
                      <span>{getRoleDisplay()}</span>
                    </span>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors z-50 relative"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div 
            ref={mobileMenuRef}
            className="lg:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-200 shadow-xl z-40"
          >
            <div className="py-4 bg-gray-50/80 backdrop-blur-sm">
              <div className="flex flex-col space-y-2 px-4">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all duration-200 flex items-center space-x-3 ${
                        item.active
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span>{item.name}</span>
                    </button>
                  )
                })}
              </div>
              
              {/* Mobile User Info */}
              <div className="mt-6 pt-4 border-t border-gray-200 px-4">
                <div className="flex items-center space-x-3 px-4 py-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center">
                    <span className="text-gray-700 font-bold">
                      {session.user.name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                    <span className={`inline-flex items-center space-x-1 mt-1 px-2 py-1 rounded-lg text-xs font-bold ${getRoleGradient()}`}>
                      {getRoleIcon()}
                      <span>{getRoleDisplay()}</span>
                    </span>
                  </div>
                </div>
                
                {/* Mobile Profile Settings */}
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl mt-2 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Profile Settings</span>
                </button>
                
                {/* Mobile Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl mt-2 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}