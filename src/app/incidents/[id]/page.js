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
  X,
  Users,
  AlertCircle,
  Navigation,
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
    // FIXED: Handle both ObjectId string and role-based recipients
    if (!recipientId) {
      console.log('No recipient ID provided')
      return
    }

    // Check if it's a valid ObjectId format (24 character hex string)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(recipientId)
    
    if (isObjectId) {
      // Try to get recipient by ID first
      const response = await fetch(`/api/recipients/${recipientId}`)
      
      if (response.ok) {
        const data = await response.json()
        setRecipient(data.recipient)
        return
      } else {
        console.log('Recipient API call failed, trying fallback...')
      }
    }
    
    // FIXED: Fallback - if recipientId is a role string or API fails, format it nicely
    if (typeof recipientId === 'string') {
      setRecipient({
        name: formatRole(recipientId),
        role: formatRole(recipientId),
        email: null,
        isRoleFallback: true
      })
    } else {
      console.log('Unable to determine recipient information')
    }
  } catch (error) {
    console.error('Error loading recipient:', error)
    
    // Final fallback for role-based recipients
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
{(recipient || incident.recipientId || incident.recipientName) && (
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
                  {/* FIXED: Display recipient information with fallbacks */}
                  <p className="font-bold text-purple-900">
                    {recipient?.name || incident.recipientName || 'Unknown Recipient'}
                  </p>
                  <p className="text-sm text-purple-700">
                    {recipient?.role || incident.recipientRole || 'Unknown Role'}
                  </p>
                  {(recipient?.email || incident.recipientEmail) && !recipient?.isRoleFallback && (
                    <p className="text-sm text-purple-600 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {recipient?.email || incident.recipientEmail}
                    </p>
                  )}
                  {recipient?.isRoleFallback && (
                    <p className="text-xs text-purple-500 italic">Role-based recipient</p>
                  )}
                  
                  {/* FIXED: Show recipient info details if available */}
                  {incident.recipientInfo && (
                    <div className="mt-2 text-xs text-purple-600">
                      <p>Type: {incident.recipientInfo.type}</p>
                      {incident.recipientInfo.totalRecipients && (
                        <p>Total Recipients: {incident.recipientInfo.totalRecipients}</p>
                      )}
                      {incident.recipientInfo.groups && incident.recipientInfo.groups.length > 0 && (
                        <p>Groups: {incident.recipientInfo.groups.join(', ')}</p>
                      )}
                    </div>
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
        {/* Guard's Location Information */}
{(incident.guardLocationGPS || incident.guardLocationManual) && (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
      <MapPin className="w-7 h-7 text-blue-600" />
      Guard's Location
    </h2>
    
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Navigation className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-blue-900">Guard's Position When Reporting</span>
      </div>
      
      <div className="text-gray-900 bg-white p-3 rounded-lg border border-blue-200">
        {incident.guardLocationGPS || 'Location not available'}
      </div>
      
      {incident.guardLocationManual && (
        <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Location entered manually (GPS was unavailable)</span>
        </div>
      )}
      
      <div className="text-xs text-blue-600 mt-2">
        📍 This location was captured when the guard submitted this report.
      </div>
    </div>
  </div>
)}  
        {/* Police Information Section */}
        {(incident.policeInvolved === true || 
          incident.policeInvolved === false || 
          incident.policeReportFiled || 
          incident.policeReportNumber || 
          incident.officerName ||
          incident.officerBadge) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-red-600" />
              Police Involvement
            </h2>
            
            <div className="space-y-6">
              {/* Police Involved Status - Always show if we have police data */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-medium text-gray-700">Police Called/Involved:</span>
                <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-bold rounded-full border ${
                  incident.policeInvolved === true 
                    ? 'bg-red-100 text-red-800 border-red-200' 
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
                  {incident.policeInvolved === true ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Yes
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      No
                    </>
                  )}
                </span>
              </div>

              {/* Show police details only if police were involved */}
              {incident.policeInvolved === true && (
                <>
                  {/* Police Report Status */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="font-medium text-blue-700">Police Report Filed:</span>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-bold rounded-full border ${
                      incident.policeReportFiled === true 
                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {incident.policeReportFiled === true ? (
                        <>
                          <FileText className="w-4 h-4" />
                          Yes
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          No
                        </>
                      )}
                    </span>
                  </div>

                  {/* Police Report Number */}
                  {incident.policeReportFiled === true && incident.policeReportNumber && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-blue-800 mb-2">
                        <Hash className="w-4 h-4" />
                        <span className="font-medium">Police Report Number</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900 bg-white p-3 rounded-lg border border-blue-200">
                        {incident.policeReportNumber}
                      </div>
                    </div>
                  )}

                  {/* Officer Information */}
                  {(incident.officerName || incident.officerBadge) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Officer Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {incident.officerName && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <User className="w-4 h-4" />
                              <span className="font-medium">Officer Name</span>
                            </div>
                            <div className="text-lg font-bold text-yellow-900 bg-white p-3 rounded-lg border border-yellow-200">
                              {incident.officerName}
                            </div>
                          </div>
                        )}

                        {incident.officerBadge && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <Hash className="w-4 h-4" />
                              <span className="font-medium">Badge/ID Number</span>
                            </div>
                            <div className="text-lg font-bold text-yellow-900 bg-white p-3 rounded-lg border border-yellow-200">
                              {incident.officerBadge}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* No Police Involvement Message */}
              {incident.policeInvolved === false && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No police involvement reported</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Witness Information Section */}
{(incident.witnessData || incident.witnesses) && (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
      <Users className="w-7 h-7 text-blue-600" />
      Witness Information
    </h2>
    
    <div className="space-y-6">
      {/* Witness Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="font-medium text-gray-700">Witness Status:</span>
        <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-bold rounded-full border ${
          incident.witnessData === 'witnesses' 
            ? 'bg-blue-100 text-blue-800 border-blue-200' 
            : incident.witnessData === 'none'
            ? 'bg-gray-100 text-gray-800 border-gray-200'
            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }`}>
          <Users className="w-4 h-4" />
          {incident.witnessData === 'witnesses' ? 'Witnesses Present' : 
           incident.witnessData === 'none' ? 'No Witnesses' : 'Not Applicable'}
        </span>
      </div>

      {/* Witness Details */}
      {incident.witnessData === 'witnesses' && incident.witnesses && incident.witnesses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-900 mb-4">
            Witness Details ({incident.witnesses.length} witness{incident.witnesses.length !== 1 ? 'es' : ''})
          </h3>
          
          {incident.witnesses.map((witness, index) => (
            <div key={index} className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-bold text-blue-900 mb-4">Witness #{index + 1}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {witness.name && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-800">
                      <User className="w-4 h-4" />
                      <span className="font-medium">Name</span>
                    </div>
                    <div className="text-lg font-bold text-blue-900 bg-white p-3 rounded-lg border border-blue-200">
                      {witness.name}
                    </div>
                  </div>
                )}

                {witness.contact && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">Contact</span>
                    </div>
                    <div className="text-lg font-bold text-blue-900 bg-white p-3 rounded-lg border border-blue-200">
                      {witness.contact}
                    </div>
                  </div>
                )}
              </div>

              {witness.statement && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-800">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Statement</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {witness.statement}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Witnesses Message */}
      {incident.witnessData === 'none' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No witnesses were present at the scene</p>
        </div>
      )}

      {/* N/A Message */}
      {incident.witnessData === 'na' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center">
              <X className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <p className="text-gray-500 font-medium">Witness information not applicable for this incident</p>
        </div>
      )}
    </div>
  </div>
)}
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
            <Shield className="w-6 h-6 text-blue-600" />
            {isMessage ? 'Message From' : 'Reporting Guard'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="font-medium">Guard Name</span>
              </div>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">{incident.guardName}</p>
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