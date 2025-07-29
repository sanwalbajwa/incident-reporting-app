'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  AlertTriangle,
  MessageCircle,
  User,
  Building2,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Paperclip,
  Send,
  Eye,
  CheckCircle,
  Shield,
  Mail,
  Phone,
  Hash,
  Image,
  Download,
  X
} from 'lucide-react'

export default function ViewIncidentPage({ params }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [incident, setIncident] = useState(null)
  const [client, setClient] = useState(null)
  const [recipient, setRecipient] = useState(null)
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
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
      case 'reviewed':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200'
      case 'resolved':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4" />
      case 'reviewed':
        return <Eye className="w-4 h-4" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-200'
      case 'urgent':
        return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-200'
      case 'normal':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />
      case 'urgent':
        return <Clock className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

 const getReporterRoleDisplay = (incident) => {
  const role = incident?.guardRole || 'guard'
  switch (role) {
    case 'rover':
      return 'Reporting Rover'
    case 'guard':
    default:
      return 'Reporting Guard'
  }
}

const getReporterRoleIcon = (incident) => {
  const role = incident?.guardRole || 'guard'
  switch (role) {
    case 'rover':
      return <UserCheck className="w-6 h-6 text-green-600" />
    case 'guard':
    default:
      return <Shield className="w-6 h-6 text-blue-600" />
  }
}

  const getBackUrl = () => {
  if (session?.user?.role === 'security_supervisor') {
    return '/supervisor-dashboard'
  }
  if (session?.user?.role === 'management') {
    return '/management/reports'
  }
  return '/incidents'
}

const getBackLabel = () => {
  if (session?.user?.role === 'security_supervisor') {
    return 'Supervisor Dashboard'
  }
  if (session?.user?.role === 'management') {
    return 'All Reports'
  }
  return 'My Reports'
}

  const isMessage = incident?.messageType === 'communication' || incident?.incidentType === 'Communication/Message'

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading incident...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  if (!incident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Incident Not Found</h1>
          <button
            onClick={() => router.push(getBackUrl())}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {getBackLabel()}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <button
              onClick={() => router.push(getBackUrl())}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-200 border border-white/20 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{getBackLabel()}</span>
        </button>
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                {isMessage ? <MessageCircle className="w-8 h-8 text-blue-600" /> : <AlertTriangle className="w-8 h-8 text-red-600" />}
                {isMessage ? 'Message Details' : 'Incident Report'}
              </h1>
              <p className="text-gray-600 mt-1">{incident.incidentId}</p>
            </div>
          </div>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex flex-wrap gap-3">
          <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border ${getStatusColor(incident.status)}`}>
            {getStatusIcon(incident.status)}
            Status: {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
          </span>
          {incident.priority && (
            <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border ${getPriorityColor(incident.priority)}`}>
              {getPriorityIcon(incident.priority)}
              Priority: {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)}
            </span>
          )}
          {isMessage && (
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-200">
              <MessageCircle className="w-4 h-4" />
              Message
            </span>
          )}
        </div>

        {/* Recipient Information */}
        {recipient && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="w-6 h-6 text-purple-600" />
              {isMessage ? 'Message Sent To' : 'Report Sent To'}
            </h2>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <p className="font-bold text-purple-900">{recipient.name}</p>
                  <p className="text-sm text-purple-700">{recipient.role}</p>
                  {recipient.email && !recipient.isRoleFallback && (
                    <p className="text-sm text-purple-600 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {recipient.email}
                    </p>
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hash className="w-4 h-4" />
                <span className="font-medium">{isMessage ? 'Message ID' : 'Incident ID'}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">{incident.incidentId}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Type</span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl flex items-center gap-2">
                {isMessage ? <MessageCircle className="w-5 h-5 text-blue-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                {incident.incidentType}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Priority</span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">
                {incident.priority ? incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1) : 'Normal'}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Date & Time</span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">
                {formatDate(incident.incidentDateTime || incident.createdAt)}
              </p>
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Location</span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">
                {incident.location}
                {incident.withinProperty !== undefined && (
                  <span className="text-sm text-gray-500 ml-2 font-normal">
                    ({incident.withinProperty ? 'Within property' : 'Outside property'})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Incident Originated By Information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-green-600" />
            Incident Origin Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">Incident originated by</span>
              </div>
              <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${
                incident.incidentOriginatedBy === 'Smile4Life' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  incident.incidentOriginatedBy === 'Smile4Life' 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
                }`}></div>
                <span className={`text-lg font-bold ${
                  incident.incidentOriginatedBy === 'Smile4Life' 
                    ? 'text-green-800' 
                    : 'text-blue-800'
                }`}>
                  {incident.incidentOriginatedBy || 'Property'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Origin Type</span>
              </div>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium">
                {incident.incidentOriginatedBy === 'Smile4Life' 
                  ? 'Company Initiated' 
                  : 'Property Initiated'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        {client && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-green-600" />
              Property/Client Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">Property Name</span>
                </div>
                <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">{client.name}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">Address</span>
                </div>
                <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">{client.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            {isMessage ? 'Message Content' : 'Incident Description'}
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{incident.description}</p>
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Paperclip className="w-6 h-6 text-blue-600" />
            Attachments
          </h2>
          {incident.attachments && incident.attachments.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">Attached files ({incident.attachments.length}):</p>
              <div className="space-y-4">
                {incident.attachments.map((file, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {file.fileType?.startsWith('image/') ? (
                          <img
                            src={file.filePath}
                            alt={file.originalName}
                            className="w-20 h-20 object-cover rounded-xl border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(file)}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          {file.fileType} • {(file.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <a
                          href={file.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </a>
                        <a
                          href={file.filePath}
                          download={file.originalName}
                          className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attachments uploaded</p>
            </div>
          )}
        </div>

        {/* Guard Information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            {getReporterRoleIcon(incident)}
            {isMessage ? 'Message From' : getReporterRoleDisplay(incident)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="font-medium">
                  {incident?.guardRole === 'rover' ? 'Rover Name' : 'Guard Name'}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">{incident.guardName}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="font-medium">
                  {incident?.guardRole === 'rover' ? 'Rover Email' : 'Guard Email'}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">{incident.guardEmail}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="font-medium">Guard Email</span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">{incident.guardEmail}</p>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            {isMessage ? 'Message Information' : 'Report Information'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{isMessage ? 'Message Sent' : 'Report Created'}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">{formatDate(incident.createdAt)}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Last Updated</span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">{formatDate(incident.updatedAt)}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage.filePath}
              alt={selectedImage.originalName}
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/50 text-white rounded-xl p-3 hover:bg-black/75 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-4 py-2 rounded-xl">
              <p className="font-medium">{selectedImage.originalName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}