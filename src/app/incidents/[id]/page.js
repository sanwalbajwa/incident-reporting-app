'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ViewIncidentPage({ params }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [incident, setIncident] = useState(null)
  const [client, setClient] = useState(null)
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
            onClick={() => router.push('/incidents')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Incidents
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Incident Details - {incident.incidentId}
            </h1>
            <div className="flex space-x-4">
              {incident.status === 'submitted' && (
                <button
                  onClick={async () => {
                    const resolvedParams = await params
                    router.push(`/incidents/edit/${resolvedParams.id}`)
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Edit Incident
                </button>
              )}
              <button
                onClick={() => router.push('/incidents')}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Back to Incidents
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(incident.status)}`}>
            Status: {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
          </span>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Incident ID</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{incident.incidentId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Incident Type</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{incident.incidentType}</p>
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

        {/* Incident Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Incident Description</h2>
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Reporting Guard</h2>
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Created</label>
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