'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeShift, setActiveShift] = useState(null)
  const [shiftHistory, setShiftHistory] = useState([])
  const [formData, setFormData] = useState({
    location: '',
    notes: ''
  })

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/login')
  }, [session, status, router])

  // Load shift status
  useEffect(() => {
    if (session) {
      loadShiftStatus()
    }
  }, [session])

  const loadShiftStatus = async () => {
    try {
      const response = await fetch('/api/checkin/status')
      const data = await response.json()
      
      if (response.ok) {
        setActiveShift(data.activeShift)
        setShiftHistory(data.history)
      }
    } catch (error) {
      console.error('Error loading shift status:', error)
    }
  }

  const handleStartShift = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/checkin/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        await loadShiftStatus()
        setFormData({ location: '', notes: '' })
        alert('Shift started successfully!')
      } else {
        alert(data.error || 'Failed to start shift')
      }
    } catch (error) {
      alert('Error starting shift')
    }
    setLoading(false)
  }

  const handleEndShift = async () => {
    const notes = prompt('Add any notes for this shift (optional):')
    
    setLoading(true)
    try {
      const response = await fetch('/api/checkin/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      })

      const data = await response.json()

      if (response.ok) {
        await loadShiftStatus()
        alert('Shift ended successfully!')
      } else {
        alert(data.error || 'Failed to end shift')
      }
    } catch (error) {
      alert('Error ending shift')
    }
    setLoading(false)
  }

  const handleLunchBreak = async (action) => {
    setLoading(true)
    try {
      const response = await fetch('/api/checkin/lunch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      const data = await response.json()

      if (response.ok) {
        await loadShiftStatus()
        alert(data.message)
      } else {
        alert(data.error || 'Failed to update lunch break')
      }
    } catch (error) {
      alert('Error updating lunch break')
    }
    setLoading(false)
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleString()
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getShiftDuration = (startTime) => {
    const now = new Date()
    const start = new Date(startTime)
    const diffMinutes = Math.floor((now - start) / (1000 * 60))
    return formatDuration(diffMinutes)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Check In/Out</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Shift Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Shift Status</h2>
          
          {activeShift ? (
            <div className="border-l-4 border-green-500 bg-green-50 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-green-800">Shift Active</h3>
                  <p className="text-green-700">
                    Started: {formatTime(activeShift.checkInTime)}
                  </p>
                  <p className="text-green-700">
                    Duration: {getShiftDuration(activeShift.checkInTime)}
                  </p>
                  {activeShift.location && (
                    <p className="text-green-700">Location: {activeShift.location}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {activeShift.lunchBreakStart && !activeShift.lunchBreakEnd ? (
                    <button
                      onClick={() => handleLunchBreak('end')}
                      disabled={loading}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:bg-orange-300"
                    >
                      End Lunch
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLunchBreak('start')}
                      disabled={loading}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:bg-orange-300"
                    >
                      Start Lunch
                    </button>
                  )}
                  <button
                    onClick={handleEndShift}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-300"
                  >
                    {loading ? 'Ending...' : 'End Shift'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-l-4 border-gray-500 bg-gray-50 p-4 mb-4">
              <h3 className="text-lg font-medium text-gray-800">No Active Shift</h3>
              <p className="text-gray-700">Ready to start your shift</p>
            </div>
          )}
        </div>

        {/* Start Shift Form */}
        {!activeShift && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Start New Shift</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Building A, Floor 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any special notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleStartShift}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-green-300 font-medium"
            >
              {loading ? 'Starting Shift...' : 'Start Shift'}
            </button>
          </div>
        )}

        {/* Shift History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Shifts</h2>
          
          {shiftHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shiftHistory.map((shift, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(shift.checkInTime).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(shift.checkInTime).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shift.checkOutTime 
                          ? new Date(shift.checkOutTime).toLocaleTimeString()
                          : 'Active'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shift.shiftDuration 
                          ? formatDuration(shift.shiftDuration)
                          : getShiftDuration(shift.checkInTime)
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          shift.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {shift.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No shift history found</p>
          )}
        </div>
      </main>
    </div>
  )
}