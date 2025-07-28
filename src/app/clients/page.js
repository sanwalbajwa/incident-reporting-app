'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Plus,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  X,
  Check,
  RefreshCw,
  Search,
  Filter,
  Building,
  Home,
  Factory,
  Layers,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    propertyType: 'Residential',
    notes: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/login')
    else loadClients()
  }, [session, status, router])

  const loadClients = async () => {
    setLoading(true)
    try {
       const response = await fetch('/api/clients')
      const data = await response.json()
      if (response.ok) {
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
    setLoading(false)
  }

  const handleBackToDashboard = () => {
    const role = session?.user?.role;
    if (role === 'security_supervisor') {
      router.push('/supervisor-dashboard');
    } else if (role === 'management') {
      router.push('/management-dashboard');
    } else if (role === 'guard') {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/clients', {
           method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Client added successfully!')
        setFormData({
          name: '',
          location: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          propertyType: 'Residential',
          notes: ''
        })
        setShowForm(false)
        loadClients()
      } else {
         alert(data.error || 'Failed to add client')
      }
    } catch (error) {
      alert('Error adding client')
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const getPropertyTypeIcon = (type) => {
    switch (type) {
      case 'Residential':
        return <Home className="w-6 h-6" />
      case 'Commercial':
        return <Building className="w-6 h-6" />
      case 'Industrial':
        return <Factory className="w-6 h-6" />
      case 'Mixed Use':
        return <Layers className="w-6 h-6" />
      default:
        return <Building2 className="w-6 h-6" />
    }
  }

  const getPropertyTypeColor = (type) => {
    switch (type)  {
      case 'Residential':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Commercial':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Industrial':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Mixed Use':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Filter  clients based on search and type
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.contactName && client.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = filterType === 'all' || client.propertyType === filterType
    
    return matchesSearch && matchesType
  })
  const handleDeleteClient = async (clientId, clientName) => {
  if (!confirm(`⚠️ WARNING: Are you absolutely sure you want to delete ${clientName}?\n\nThis action cannot be undone and will:\n- Remove the client from the system\n- Prevent new incidents from being assigned to this client\n- Keep existing incident history for records\n\nType "DELETE" to confirm.`)) {
    return
  }

  const confirmation = prompt(`To confirm deletion of ${clientName}, please type "DELETE" (in capital letters):`);
  if (confirmation !== 'DELETE') {
    alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
    return;
  }

  setLoading(true)
  
  try {
    const response = await fetch('/api/clients', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      alert(`✅ ${clientName} has been successfully deleted from the system.`)
      loadClients() // Refresh the list
    } else {
      alert(`❌ Error: ${data.error}`)
    }
  } catch (error) {
    alert('❌ Network error occurred')
    console.error('Delete client error:', error)
  }
  
  setLoading(false)
}
  const propertyTypes = ['Residential', 'Commercial', 'Industrial', 'Mixed Use']
  const typeStats = propertyTypes.map(type => ({
    type,
    count: clients.filter(c => c.propertyType === type).length
  }))

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full  h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <button
              onClick={handleBackToDashboard}
               className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-200 border border-white/20 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
        </button>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center  justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                Client Management
              </h1>
   
              <p className="text-gray-600 mt-1">Manage properties and client information</p>
            </div>
          </div>
          
          {(session?.user?.role === 'security_supervisor' || session?.user?.role === 'management') && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
       
               Add Client
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
       
           <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search clients by name, location, or contact..."
                value={searchTerm}
  
                 onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
              />
            </div>
            
            {/* Filter */}
     
             <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500  focus:border-blue-500 bg-white/50"
              >
                <option value="all">All Types</option>
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
             
               </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
            <div className="text-sm text-gray-600 font-medium">Total Clients</div>
          </div>

          {typeStats.map(({ type, count }) => {
            const getTypeBackground = (propertyType) => {
              switch (propertyType) {
                case 'Residential':
                  return 'bg-gradient-to-br from-blue-500 to-blue-600'
                case 'Commercial':
                  return 'bg-gradient-to-br from-green-500 to-green-600'
                case 'Industrial':
                  return 'bg-gradient-to-br from-orange-500 to-orange-600'
                case 'Mixed Use':
                  return 'bg-gradient-to-br from-purple-500 to-purple-600'
                default:
                  return 'bg-gradient-to-br from-gray-500 to-gray-600'
              }
            }

            const getTypeTextColor = (propertyType) => {
              switch (propertyType) {
                case 'Residential':
                  return 'text-blue-700'
                case 'Commercial':
                  return 'text-green-700'
                case 'Industrial':
                  return 'text-orange-700'
                case 'Mixed Use':
                  return 'text-purple-700'
                default:
                  return 'text-gray-700'
              }
            }

            return (
              <div key={type} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
                <div className={`w-12 h-12 ${getTypeBackground(type)} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                  <div className="text-white">
                    {getPropertyTypeIcon(type)}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getTypeTextColor(type)}`}>{count}</div>
                <div className="text-sm text-gray-600 font-medium">{type}</div>
              </div>
            )
          })}
        </div>

        {/* Add Client Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50  backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-white/20 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Plus className="w-7 h-7 text-blue-600" />
           
                   Add New Client
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                
                 >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             
                   <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Property Name <span className="text-red-500">*</span>
                
                     </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
          
                       onChange={handleChange}
                      required
                      placeholder="Riverside Apartments"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
           
                     />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
 
                       Location/Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
               
                       name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="123 Main Street, City"
  
                       className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
             
                     <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Contact Person
                    </label>
                 
                     <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
         
                       placeholder="John Smith"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                    />
                  </div>

                
                   <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      Contact Phone
                    </label>
 
                     <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
               
                       onChange={handleChange}
                      placeholder="+1-555-0123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                    />
                  </div>

 
                   <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Contact Email
      
                     </label>
                    <input
                      type="email"
                      name="contactEmail"
                      
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="contact@property.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                    />
    
                   </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
              
                       Property Type
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
       
                       onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                    >
                      <option value="Residential">Residential</option>
          
                       <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Mixed Use">Mixed Use</option>
                    </select>
                  </div>
 
                 </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                   
                   Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
   
                   rows="3"
                    placeholder="Additional information about this property..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                  />
           
                 </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                  
                     className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-400 text-white py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ?
                     (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Adding...
                      </>
 
                     ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Add Client
     
                       </>
                    )}
                  </button>
                  <button
                    type="button"
       
                     onClick={() => setShowForm(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
              
                     Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Clients List */}
     
         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {loading ?
           (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading clients...</p>
            </div>
          ) : filteredClients.length > 0 ?
           (
            <>
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  Clients ({filteredClients.length})
    
                 {searchTerm && (
                    <span className="text-sm font-normal text-gray-600">
                      - Filtered by &quot;{searchTerm}&quot;
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
                        Property Name
                  
                       </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                    
                     <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
              
                         Contact
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Actions
              
                       </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredClients.map((client) => (
           
                     <tr key={client._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getPropertyTypeIcon(client.propertyType)}
   
                             <div>
                              <div className="text-sm font-bold text-gray-900">
                                {client.name}
          
                               </div>
                              {client.notes && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">
            
                                 {client.notes}
                                </div>
                              )}
                
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
            
                           <div className="flex items-center gap-2 text-sm text-gray-900">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {client.location}
                     
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-full border ${getPropertyTypeColor(client.propertyType)}`}>
         
                             {getPropertyTypeIcon(client.propertyType)}
                            {client.propertyType}
                          </span>
                        </td>
   
                         <td className="px-6 py-4">
                          {client.contactName ?
                           (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" 
                                 />
                                {client.contactName}
                              </div>
                              {client.contactPhone && (
      
                                 <div className="text-gray-600 flex items-center gap-2 mt-1">
                                  <Phone className="w-3 h-3" />
                                
                                   {client.contactPhone}
                                </div>
                              )}
                              {client.contactEmail && (
    
                                 <div className="text-gray-600 flex items-center gap-2 mt-1">
                                  <Mail className="w-3 h-3" />
                              
                                   {client.contactEmail}
                                </div>
                              )}
                            </div>
      
                           ) : (
                            <span className="text-gray-400 italic">No contact info</span>
                          )}
                    
                         </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {/* Add view functionality */}}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            
                            {(session?.user?.role === 'security_supervisor' || session?.user?.role === 'management') && (
                              <>
                                <button
                                  onClick={() => {/* Add edit functionality */}}
                                  className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteClient(client._id, client.name)}
                                  disabled={loading}
                                  className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                  {loading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                  
                                </button>
                              </>
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
                {filteredClients.map((client) => (
                  <div key={client._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
             
                     <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getPropertyTypeIcon(client.propertyType)}
                        <div>
                
                         <div className="text-sm font-bold text-gray-900">
                            {client.name}
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs  font-bold rounded-full border mt-1 ${getPropertyTypeColor(client.propertyType)}`}>
                            {client.propertyType}
                          </span>
                        </div>
                  
                       </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
       
                         <MapPin className="w-4 h-4" />
                        {client.location}
                      </div>
                      {client.contactName && (
          
                         <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {client.contactName}
                        </div>
    
                       )}
                      {client.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
  
                           {client.contactPhone}
                        </div>
                      )}
                    </div>
          
           
                    <div className="flex gap-2">
  <button
    onClick={() => {/* Add view functionality */}}
    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
  >
    <Eye className="w-4 h-4" />
    View
  </button>
  
  {(session?.user?.role === 'security_supervisor' || session?.user?.role === 'management') && (
    <>
      <button
        onClick={() => {/* Add edit functionality */}}
        className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
      >
        <Edit className="w-4 h-4" />
        Edit
      </button>
      
      <button
        onClick={() => handleDeleteClient(client._id, client.name)}
        disabled={loading}
        className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </>
  )}
</div>
                  </div>
                ))}
              </div>
         
             </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-gray-600" />
              </div>
            
               <h3 className="text-xl font-bold text-gray-900 mb-4">No clients found</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {searchTerm ||
                 filterType !== 'all' 
                  ?
                  "No clients match your current search or filter criteria."
                  : "No clients have been added yet."
                 }
              </p>
              {(session?.user?.role === 'security_supervisor' || session?.user?.role === 'management') && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold  transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Client
                </button>
              )}
   
             </div>
          )}
        </div>
      </main>
    </div>
  )
}