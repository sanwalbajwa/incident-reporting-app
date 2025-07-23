'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ViewIncidentPage({ params }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [incident, setIncident] = useState(null)
  const [client, setClient] = useState(null)
  const [recipient, setRecipient] = useState(null) // Add recipient state
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      if (status === 'loading') return
      if (!session) {
        router.push('/login')
        return
      }
      
      try {
        // Await params for Next.js 15
        const resolvedParams = await params
        
        console.log('Loading incident with ID:', resolvedParams.id)
        
        const response = await fetch(`/api/incidents/${resolvedParams.id}`)
        const data = await response.json()
        
        console.log('API response:', data)
        
        if (response.ok) {
          setIncident(data.incident)
          // Load client details
          if (data.incident.clientId) {
            loadClient(data.incident.clientId)
          }
          // Load recipient details
          if (data.incident.recipientId) {
            loadRecipient(data.incident.recipientId)
          }
        } else {
          alert('Incident not found: ' + data.error)
          router.push('/incidents')
        }
      } catch (error) {
        console.error('Error loading incident:', error)
        alert('Error loading incident')
        router.push('/incidents')
      }
      setLoading(false)
    }

    loadData()
  }, [session, status, router, params])

  const loadClient = async (clientId) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const data = await response.json()
      
      if (response.ok) {
        setClient(data.client)
      }
    } catch (error) {
      console.error('Error loading client:', error)
    }
  }

  const loadRecipient = async (recipientId) => {
    try {
      // Try to get recipient by ID first
      const response = await fetch(`/api/recipients/${recipientId}`)
      
      if (response.ok) {
        const data = await response.json()
        setRecipient(data.recipient)
      } else {
        // Fallback: if recipientId is a role string, format it nicely
        if (typeof recipientId === 'string') {
          setRecipient({
            name: formatRole(recipientId),
            role: formatRole(recipientId),
            email: null,
            isRoleFallback: true
          })
        }
      }
    } catch (error) {
      console.error('Error loading recipient:', error)
      // Fallback for role-based recipients
      if (typeof recipientId === 'string') {
        setRecipient({
          name: formatRole(recipientId),
          role: formatRole(recipientId),
          email: null,
          isRoleFallback: true
        })
      }
    }
  }

  // Helper function to format role names
  const formatRole = (role) => {
    switch (role) {
      case 'security_supervisor':
        return 'Security Supervisor'
      case 'maintenance':
        return 'Maintenance Team'
      case 'management':
        return 'Management'
      default:
        return role
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}

  const isMessage = incident?.messageType === 'communication' || incident?.incidentType === 'Communication/Message'

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading incident...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Incident Not Found</h1>
          <button
            onClick={() => {
              // If user is supervisor, go back to supervisor dashboard
              if (session.user.role === 'security_supervisor') {
                router.push('/supervisor-dashboard')
              } else {
                router.push('/incidents')
              }
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to {session.user.role === 'security_supervisor' ? 'Dashboard' : 'Incidents'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status and Priority Badges */}
        <div className="mb-6 flex space-x-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(incident.status)}`}>
            Status: {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
          </span>
          {incident.priority && (
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityColor(incident.priority)}`}>
              Priority: {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)}
            </span>
          )}
          {isMessage && (
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full border bg-purple-100 text-purple-800 border-purple-200">
              💬 Message
            </span>
          )}
        </div>

        {/* Recipient Information - NEW SECTION */}
        {recipient && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              📤 {isMessage ? 'Message Sent To' : 'Report Sent To'}
            </h2>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-medium text-lg">
                    {recipient.name?.charAt(0) || '👤'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-purple-900">{recipient.name}</p>
                  <p className="text-sm text-purple-700">{recipient.role}</p>
                  {recipient.email && !recipient.isRoleFallback && (
                    <p className="text-sm text-purple-600">{recipient.email}</p>
                  )}
                  {recipient.isRoleFallback && (
                    <p className="text-xs text-purple-500 italic">Role-based recipient</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {isMessage ? 'Message ID' : 'Incident ID'}
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{incident.incidentId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {isMessage ? '💬' : '🚨'} {incident.incidentType}
              </p>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {incident.priority ? incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1) : 'Normal'}
            </p>
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date & Time</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(incident.incidentDateTime || incident.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {incident.location}
                {incident.withinProperty !== undefined && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({incident.withinProperty ? 'Within property' : 'Outside property'})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        {client && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Property/Client Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Name</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{client.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{client.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {isMessage ? 'Message Content' : 'Incident Description'}
          </h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{incident.description}</p>
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Attachments</h2>
          {incident.attachments && incident.attachments.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">Attached files ({incident.attachments.length}):</p>
              <div className="space-y-4">
                {incident.attachments.map((file, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {file.fileType?.startsWith('image/') ? (
                          <img
                            src={file.filePath}
                            alt={file.originalName}
                            className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(file)}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {file.fileType} • {(file.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <a
                          href={file.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
              No attachments uploaded
            </div>
          )}
        </div>

        {/* Guard Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {isMessage ? 'Message From' : 'Reporting Guard'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Guard Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{incident.guardName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Guard Email</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{incident.guardEmail}</p>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {isMessage ? 'Message Information' : 'Report Information'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {isMessage ? 'Message Sent' : 'Report Created'}
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatDate(incident.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatDate(incident.updatedAt)}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage.filePath}
              alt={selectedImage.originalName}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}