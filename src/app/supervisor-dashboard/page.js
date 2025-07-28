'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  ArrowLeft,
  Mail,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageCircle,
  Shield,
  Users,
  Calendar,
  MapPin,
  Paperclip,
  RefreshCw,
  Filter,
  TrendingUp,
  BarChart3,
  Bell,
  Archive,
  User,
  Building2,
  FileText,
  Search,
  ExternalLink
} from 'lucide-react'

export default function SupervisorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [stats, setStats] = useState({
    totalMessages: 0,
    unreadMessages: 0,
    todayMessages: 0,
    urgentMessages: 0
  })
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/login') // Not logged in
      return
    }
    
    // Check if user has supervisor role
    if (session.user.role !== 'security_supervisor') {
      router.push('/dashboard') // Redirect non-supervisors to regular dashboard
      return
    }
    
    loadMessages()
    setLoading(false)
  }, [session, status, router])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/supervisor/messages?limit=50')
      const data = await response.json()
      
      console.log('Supervisor messages response:', data)
      
      if (response.ok) {
        setMessages(data.messages || [])
        
        // Calculate stats
        const messages = data.messages || []
        const today = new Date().toDateString()
        
        setStats({
          totalMessages: data.total || 0,
          unreadMessages: messages.filter(m => !m.readAt).length,
          todayMessages: messages.filter(m => 
            new Date(m.createdAt).toDateString() === today
          ).length,
          urgentMessages: messages.filter(m => 
            m.priority === 'urgent' || m.priority === 'critical'
          ).length
        })
      } else {
        console.error('Error loading messages:', data.error)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
    setLoading(false)
  }

  const markAsRead = async (messageId) => {
    try {
      const response = await fetch('/api/supervisor/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId,
          action: 'mark_read'
        })
      })

      if (response.ok) {
        // Refresh messages
        loadMessages()
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  const getRelativeTime = (date) => {
    const now = new Date()
    const messageDate = new Date(date)
    const diffMs = now - messageDate
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return messageDate.toLocaleDateString()
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300'
      case 'urgent':
        return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300'
      case 'normal':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300'
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />
      case 'urgent':
        return <Clock className="w-4 h-4" />
      default:
        return <Mail className="w-4 h-4" />
    }
  }

  const getMessageTypeIcon = (messageType) => {
    return messageType === 'communication' ? (
      <MessageCircle className="w-5 h-5 text-blue-600" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-red-600" />
    )
  }

  const getMessageTypeLabel = (messageType) => {
    return messageType === 'communication' ? 'Message' : 'Incident'
  }

  // Filter and search messages
  const filteredMessages = messages.filter(message => {
    // Apply active filter
    let passesFilter = true
    switch (activeFilter) {
      case 'unread':
        passesFilter = !message.readAt
        break
      case 'urgent':
        passesFilter = message.priority === 'urgent' || message.priority === 'critical'
        break
      case 'communications':
        passesFilter = message.messageType === 'communication'
        break
      case 'incidents':
        passesFilter = message.messageType === 'incident'
        break
      case 'today':
        passesFilter = new Date(message.createdAt).toDateString() === new Date().toDateString()
        break
      default:
        passesFilter = true
    }

    // Apply search term
    if (searchTerm && passesFilter) {
      const searchLower = searchTerm.toLowerCase()
      passesFilter = (
        message.incidentType?.toLowerCase().includes(searchLower) ||
        message.guardName?.toLowerCase().includes(searchLower) ||
        message.guardEmail?.toLowerCase().includes(searchLower) ||
        message.location?.toLowerCase().includes(searchLower) ||
        message.description?.toLowerCase().includes(searchLower) ||
        message.incidentId?.toLowerCase().includes(searchLower)
      )
    }

    return passesFilter
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'security_supervisor') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-600" />
                Supervisor Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {session.user.name?.split(' ')[0]}</p>
              <p className="text-sm text-purple-600 font-medium">
                Viewing reports sent to you as Security Supervisor
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* <button
              onClick={loadMessages}
              disabled={loading}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button> */}
            
            <button
              onClick={() => router.push('/supervisor/guards')}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <Users className="w-4 h-4" />
              Manage Guards
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
            <div className="text-sm text-gray-600 font-medium">Total Reports</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.unreadMessages}</div>
            <div className="text-sm text-gray-600 font-medium">Unread</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.todayMessages}</div>
            <div className="text-sm text-gray-600 font-medium">Today</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.urgentMessages}</div>
            <div className="text-sm text-gray-600 font-medium">Urgent</div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by guard name, incident type, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filter:</span>
              </div>
              {[
                { key: 'all', label: `All (${messages.length})`, count: messages.length },
                { key: 'unread', label: `Unread (${stats.unreadMessages})`, count: stats.unreadMessages },
                { key: 'urgent', label: `Urgent (${stats.urgentMessages})`, count: stats.urgentMessages },
                { key: 'today', label: `Today (${stats.todayMessages})`, count: stats.todayMessages },
                { key: 'communications', label: 'Messages', count: messages.filter(m => m.messageType === 'communication').length },
                { key: 'incidents', label: 'Incidents', count: messages.filter(m => m.messageType === 'incident').length }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeFilter === filter.key 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              Reports Sent to You ({filteredMessages.length})
              {searchTerm && (
                <span className="text-sm font-normal text-gray-600">
                  - Search: "{searchTerm}"
                </span>
              )}
            </h2>
          </div>

          {filteredMessages.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredMessages.map((message) => (
                <div 
                  key={message._id} 
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !message.readAt ? 'bg-blue-50/50 border-l-4 border-l-blue-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header with type, priority, and status */}
                      <div className="flex items-center space-x-3 mb-3">
                        {getMessageTypeIcon(message.messageType)}
                        <h3 className="text-lg font-bold text-gray-900">
                          {message.incidentType}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full border ${getPriorityColor(message.priority)}`}>
                          {getPriorityIcon(message.priority)}
                          {message.priority || 'normal'}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
                          {getMessageTypeLabel(message.messageType)}
                        </span>
                        {!message.readAt && (
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      
                      {/* Incident ID */}
                      <div className="mb-3">
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                          ID: {message.incidentId}
                        </span>
                      </div>
                      
                      {/* Details grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">From:</span> {message.guardName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="font-medium">Email:</span> {message.guardEmail}
                        </div>
                        {message.client && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span className="font-medium">Property:</span> {message.client.name}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">Location:</span> {message.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">Reported:</span> {getRelativeTime(message.createdAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">Full Date:</span> {formatDate(message.createdAt)}
                        </div>
                      </div>
                      
                      {/* Description preview */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-gray-900 leading-relaxed">
                          {message.description.length > 200 
                            ? `${message.description.substring(0, 200)}...` 
                            : message.description
                          }
                        </p>
                      </div>
                      
                      {/* Attachments indicator */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg py-2 px-3 mb-4">
                          <Paperclip className="w-4 h-4" />
                          <span>{message.attachments.length} attachment(s)</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => router.push(`/incidents/${message._id}`)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      {!message.readAt && (
                        <button
                          onClick={() => markAsRead(message._id)}
                          className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Archive className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">No reports found</h3>
              <p className="text-gray-600 text-lg">
                {searchTerm || activeFilter !== 'all'
                  ? `No reports match your current ${searchTerm ? 'search' : 'filter'} criteria.`
                  : "No reports have been sent to you yet."
                }
              </p>
              {(searchTerm || activeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setActiveFilter('all')
                  }}
                  className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-2xl p-8 text-white text-center shadow-xl">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">Supervision Overview</h3>
          <p className="text-lg opacity-90 mb-4">
            You have {stats.totalMessages} total reports from your security team
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
              <span>{stats.unreadMessages} Unread</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-full"></div>
              <span>{stats.todayMessages} Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-300 rounded-full"></div>
              <span>{stats.urgentMessages} Urgent</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}