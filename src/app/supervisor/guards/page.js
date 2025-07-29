'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  ArrowLeft,
  Users,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Square,
  User,
  Phone,
  Mail,
  Hash,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Timer,
  MapPin,
  MessageSquare,
  Eye,
  Filter,
  Search
} from 'lucide-react'

export default function GuardManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [guards, setGuards] = useState([])
  const [stats, setStats] = useState({
    totalGuards: 0,
    onDuty: 0,
    offDuty: 0
  })
  const [actionLoading, setActionLoading] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'on_duty', 'off_duty'

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    
    // Check if user is supervisor
    if (session.user.role !== 'security_supervisor') {
      router.push('/dashboard')
      return
    }
    
    loadGuards()
  }, [session, status, router])

  const loadGuards = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/supervisor/guards')
      const data = await response.json()
      
      if (response.ok) {
        setGuards(data.guards || [])
        setStats(data.stats || { totalGuards: 0, onDuty: 0, offDuty: 0 })
      } else {
        console.error('Error loading guards:', data.error)
      }
    } catch (error) {
      console.error('Error loading guards:', error)
    }
    setLoading(false)
  }

  const handleShiftAction = async (guardId, action, guardName) => {
    const confirmMessage = action === 'start_shift' 
      ? `Are you sure you want to start a shift for ${guardName}?`
      : `Are you sure you want to end the current shift for ${guardName}?`
    
    if (!confirm(confirmMessage)) return
    
    setActionLoading(guardId)
    
    try {
      const response = await fetch('/api/supervisor/guards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guardId,
          action,
          notes: `${action === 'start_shift' ? 'Started' : 'Ended'} by supervisor: ${session.user.name}`
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
        loadGuards() // Refresh the list
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Network error occurred')
      console.error('Shift action error:', error)
    }
    
    setActionLoading(null)
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString()
  }

  // Filter guards based on search and status
  const filteredGuards = guards.filter(guard => {
    const matchesSearch = guard.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guard.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (guard.employeeId && guard.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'on_duty' && guard.isOnDuty) ||
                         (statusFilter === 'off_duty' && !guard.isOnDuty)
    
    return matchesSearch && matchesStatus
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-purple-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading guards...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'security_supervisor') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <button
            onClick={() => router.push('/supervisor-dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-200 border border-white/20 shadow-sm"
            >
            <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                Guard Management
              </h1>
              <p className="text-gray-600 mt-1">Manage guard shifts and status</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalGuards}</div>
            <div className="text-sm text-gray-600 font-medium">Total Guards</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.onDuty}</div>
            <div className="text-sm text-gray-600 font-medium">On Duty</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-600">{stats.offDuty}</div>
            <div className="text-sm text-gray-600 font-medium">Off Duty</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search guards by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50"
              />
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50"
              >
                <option value="all">All Guards</option>
                <option value="on_duty">On Duty</option>
                <option value="off_duty">Off Duty</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guards List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-3 border-purple-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading guards...</p>
            </div>
          ) : filteredGuards.length > 0 ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-purple-600" />
                  Guards ({filteredGuards.length})
                  {searchTerm && (
                    <span className="text-sm font-normal text-gray-600">
                      - Filtered by "{searchTerm}"
                    </span>
                  )}
                </h2>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Guard Info
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Current Shift
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredGuards.map((guard) => (
                      <tr key={guard._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center">
                              <span className="text-gray-700 font-bold text-sm">
                                {guard.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">
                                {guard.fullName}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {guard.email}
                              </div>
                              {guard.employeeId && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  {guard.employeeId}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-full border ${
                            guard.isOnDuty
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
                          }`}>
                            {guard.isOnDuty ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                On Duty
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Off Duty
                              </>
                            )}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          {guard.isOnDuty && guard.activeShift ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 flex items-center gap-1">
                                <Timer className="w-4 h-4 text-blue-500" />
                                {formatDuration(guard.shiftDuration)}
                              </div>
                              <div className="text-gray-500 flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                Started: {formatDate(guard.activeShift.checkInTime)}
                              </div>
                              {guard.activeShift.location && (
                                <div className="text-gray-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {guard.activeShift.location}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No active shift</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {guard.isOnDuty ? (
                              <button
                                onClick={() => handleShiftAction(guard._id, 'end_shift', guard.fullName)}
                                disabled={actionLoading === guard._id}
                                className="bg-red-100 hover:bg-red-200 disabled:bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                {actionLoading === guard._id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                                End Shift
                              </button>
                            ) : (
                              <button
                                onClick={() => handleShiftAction(guard._id, 'start_shift', guard.fullName)}
                                disabled={actionLoading === guard._id}
                                className="bg-green-100 hover:bg-green-200 disabled:bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                {actionLoading === guard._id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                                Start Shift
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredGuards.map((guard) => (
                  <div key={guard._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center">
                          <span className="text-gray-700 font-bold text-sm">
                            {guard.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {guard.fullName}
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border mt-1 ${
                            guard.isOnDuty
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
                          }`}>
                            {guard.isOnDuty ? 'On Duty' : 'Off Duty'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {guard.email}
                      </div>
                      {guard.employeeId && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          {guard.employeeId}
                        </div>
                      )}
                      {guard.isOnDuty && guard.activeShift && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Timer className="w-4 h-4" />
                          Shift: {formatDuration(guard.shiftDuration)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {guard.isOnDuty ? (
                        <button
                          onClick={() => handleShiftAction(guard._id, 'end_shift', guard.fullName)}
                          disabled={actionLoading === guard._id}
                          className="flex-1 bg-red-100 hover:bg-red-200 disabled:bg-red-50 text-red-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          {actionLoading === guard._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          End Shift
                        </button>
                      ) : (
                        <button
                          onClick={() => handleShiftAction(guard._id, 'start_shift', guard.fullName)}
                          disabled={actionLoading === guard._id}
                          className="flex-1 bg-green-100 hover:bg-green-200 disabled:bg-green-50 text-green-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          {actionLoading === guard._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Start Shift
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">No guards found</h3>
              <p className="text-gray-600 text-lg">
                {searchTerm || statusFilter !== 'all' 
                  ? "No guards match your current search or filter criteria."
                  : "No guards have been registered yet."
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}