// src/app/management/supervisors/page.js

'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  ArrowLeft,
  Shield,
  User,
  Mail,
  Hash,
  Calendar,
  RefreshCw,
  Search,
  Crown,
  Users,
  MessageCircle,
  Clock,
  CheckCircle,
  BarChart3,
  Trash2,
} from 'lucide-react'

export default function ManagementSupervisorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [supervisors, setSupervisors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    
    // Check if user is management
    if (session.user.role !== 'management') {
      router.push('/dashboard')
      return
    }
    
    loadSupervisors()
  }, [session, status, router])

  const loadSupervisors = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/management/supervisors')
      const data = await response.json()
      
      if (response.ok) {
        setSupervisors(data.supervisors || [])
      } else {
        console.error('Error loading supervisors:', data.error)
        // For demo purposes, use mock data if API doesn't exist yet
        setSupervisors([
          {
            _id: '1',
            fullName: 'John Smith',
            email: 'john.supervisor@company.com',
            employeeId: 'SUP001',
            phone: '+1-555-0123',
            createdAt: '2024-01-15T10:00:00Z',
            lastLogin: '2024-12-01T08:30:00Z',
            isActive: true
          },
          {
            _id: '2',
            fullName: 'Sarah Johnson',
            email: 'sarah.supervisor@company.com',
            employeeId: 'SUP002',
            phone: '+1-555-0124',
            createdAt: '2024-02-10T14:00:00Z',
            lastLogin: '2024-12-01T09:15:00Z',
            isActive: true
          },
          {
            _id: '3',
            fullName: 'Mike Davis',
            email: 'mike.supervisor@company.com',
            employeeId: 'SUP003',
            phone: '+1-555-0125',
            createdAt: '2024-03-05T16:00:00Z',
            lastLogin: '2024-11-30T17:45:00Z',
            isActive: true
          }
        ])
      }
    } catch (error) {
      console.error('Error loading supervisors:', error)
      // Use mock data for demo
      setSupervisors([
        {
          _id: '1',
          fullName: 'John Smith',
          email: 'john.supervisor@company.com',
          employeeId: 'SUP001',
          phone: '+1-555-0123',
          createdAt: '2024-01-15T10:00:00Z',
          lastLogin: '2024-12-01T08:30:00Z',
          isActive: true
        }
      ])
    }
    setLoading(false)
  }

  const formatDate = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString()
  }

  const getTimeSince = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const past = new Date(date)
    const diffMs = now - past
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const filteredSupervisors = supervisors.filter(supervisor => 
    supervisor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supervisor.employeeId && supervisor.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleDeleteSupervisor = async (supervisorId, supervisorName) => {
  if (!confirm(`⚠️ WARNING: Are you absolutely sure you want to delete ${supervisorName}?\n\nThis action cannot be undone and will:\n- Remove the supervisor from the system\n- Prevent them from logging in\n- Transfer their managed incidents to other supervisors\n\nType "DELETE" to confirm.`)) {
    return
  }

  const confirmation = prompt(`To confirm deletion of ${supervisorName}, please type "DELETE" (in capital letters):`);
  if (confirmation !== 'DELETE') {
    alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
    return;
  }

  setLoading(true)
  
  try {
    const response = await fetch('/api/management/supervisors', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        supervisorId
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      alert(`✅ ${supervisorName} has been successfully deleted from the system.`)
      loadSupervisors() // Refresh the list
    } else {
      alert(`❌ Error: ${data.error}`)
    }
  } catch (error) {
    alert('❌ Network error occurred')
    console.error('Delete supervisor error:', error)
  }
  
  setLoading(false)
}

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading supervisors...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'management') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <button
              onClick={() => router.push('/management-dashboard')}
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
                <Crown className="w-8 h-8 text-blue-600" />
                <Shield className="w-8 h-8 text-purple-600" />
                Supervisor Management
              </h1>
              <p className="text-gray-600 mt-1">Manage security supervisors and their activities</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{supervisors.length}</div>
            <div className="text-sm text-gray-600 font-medium">Total Supervisors</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-green-600">{supervisors.filter(s => s.isActive).length}</div>
            <div className="text-sm text-gray-600 font-medium">Active</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {supervisors.filter(s => {
                const lastLogin = new Date(s.lastLogin)
                const today = new Date()
                return lastLogin.toDateString() === today.toDateString()
              }).length}
            </div>
            <div className="text-sm text-gray-600 font-medium">Active Today</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-orange-600">98%</div>
            <div className="text-sm text-gray-600 font-medium">Performance</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search supervisors by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50"
            />
          </div>
        </div>

        {/* Supervisors List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-3 border-purple-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading supervisors...</p>
            </div>
          ) : filteredSupervisors.length > 0 ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-purple-600" />
                  Security Supervisors ({filteredSupervisors.length})
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
                        Supervisor Information
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Contact Details
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredSupervisors.map((supervisor) => (
                      <tr key={supervisor._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {supervisor.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-gray-900">
                                {supervisor.fullName}
                              </div>
                              {supervisor.employeeId && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  ID: {supervisor.employeeId}
                                </div>
                              )}
                              <div className="text-xs text-gray-400">
                                Joined: {formatDate(supervisor.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {supervisor.email}
                            </div>
                            {supervisor.phone && (
                              <div className="text-sm text-gray-500">
                                📞 {supervisor.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {getTimeSince(supervisor.lastLogin)}
                            </div>
                            <div className="text-gray-500">
                              {formatDate(supervisor.lastLogin)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-full border ${
                            supervisor.isActive
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
                          }`}>
                            <CheckCircle className="w-3 h-3" />
                            {supervisor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                        <button
                            onClick={() => handleDeleteSupervisor(supervisor._id, supervisor.fullName)}
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                            {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                            <Trash2 className="w-4 h-4" />
                            )}
                            Delete
                        </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredSupervisors.map((supervisor) => (
                  <div key={supervisor._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {supervisor.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {supervisor.fullName}
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border mt-1 ${
                            supervisor.isActive
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
                          }`}>
                            {supervisor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {supervisor.email}
                      </div>
                      {supervisor.employeeId && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          ID: {supervisor.employeeId}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="w-4 h-4" />
                        Last active: {getTimeSince(supervisor.lastLogin)}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => handleDeleteSupervisor(supervisor._id, supervisor.fullName)}
                            disabled={loading}
                            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                        >
                            {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                            <Trash2 className="w-4 h-4" />
                            )}
                            Delete Supervisor
                        </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-300 to-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">No supervisors found</h3>
              <p className="text-gray-600 text-lg">
                {searchTerm 
                  ? "No supervisors match your search criteria."
                  : "No security supervisors have been registered yet."
                }
              </p>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-2xl p-8 text-white text-center shadow-xl">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">Supervision Overview</h3>
          <p className="text-lg opacity-90 mb-4">
            Managing {supervisors.length} security supervisors across all properties
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-full"></div>
              <span>{supervisors.filter(s => s.isActive).length} Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
              <span>{supervisors.filter(s => {
                const lastLogin = new Date(s.lastLogin)
                const today = new Date()
                return lastLogin.toDateString() === today.toDateString()
              }).length} Active Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
              <span>98% Performance Rate</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}