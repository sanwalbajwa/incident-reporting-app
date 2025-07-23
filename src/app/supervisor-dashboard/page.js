'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
    try {
      const response = await fetch('/api/supervisor/messages?limit=10')
      const data = await response.json()
      
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
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getMessageTypeIcon = (messageType) => {
    return messageType === 'communication' ? '💬' : '🚨'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'security_supervisor') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📨</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">📬</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">📅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">🚨</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgentMessages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Recent Messages & Reports
              </h2>
              <div className="flex space-x-2">
                <button className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  All ({stats.totalMessages})
                </button>
                <button className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200">
                  Communications
                </button>
                <button className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200">
                  Incidents
                </button>
              </div>
            </div>
          </div>

          {messages.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {messages.map((message) => (
                <div 
                  key={message._id} 
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !message.readAt ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg">
                          {getMessageTypeIcon(message.messageType)}
                        </span>
                        <h3 className="text-sm font-medium text-gray-900">
                          {message.incidentType}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(message.priority)}`}>
                          {message.priority || 'normal'}
                        </span>
                        {!message.readAt && (
                          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                            NEW
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">From:</span> {message.guardName} ({message.guardEmail})
                      </div>
                      
                      {message.client && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Property:</span> {message.client.name} - {message.client.location}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Location:</span> {message.location}
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-3">
                        {message.description.length > 150 
                          ? `${message.description.substring(0, 150)}...` 
                          : message.description
                        }
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatDate(message.createdAt)}</span>
                        {message.attachments && message.attachments.length > 0 && (
                          <span>📎 {message.attachments.length} attachment(s)</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => router.push(`/incidents/${message._id}`)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details
                      </button>
                      {!message.readAt && (
                        <button
                          onClick={() => markAsRead(message._id)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <span className="text-4xl">📭</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600">
                Messages and incident reports from guards will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {messages.length > 10 && (
          <div className="mt-6 text-center">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
              View All Messages
            </button>
          </div>
        )}

      </main>
    </div>
  )
}