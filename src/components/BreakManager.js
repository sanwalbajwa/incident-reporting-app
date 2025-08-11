// Alternative version: src/components/BreakManager.js - Using the hook
'use client'
import { useState, useEffect } from 'react'
import { Coffee, Clock, Play, Square, Timer, UtensilsCrossed, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
// import { useBreakStatus } from '@/hooks/useBreakStatus' // Uncomment when you create the hook

export default function BreakManager() {
  // If you want to use the hook instead, uncomment the line below and remove the manual state management
  // const { breakStatus, loading, error, startBreak, endBreak } = useBreakStatus()
  
  // Manual state management (current implementation)
  const [breakStatus, setBreakStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    loadBreakStatus()
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    // Auto-refresh break status every 30 seconds
    const statusInterval = setInterval(loadBreakStatus, 30000)
    
    return () => {
      clearInterval(timeInterval)
      clearInterval(statusInterval)
    }
  }, [])
  
  const loadBreakStatus = async () => {
    try {
      setError(null)
      const response = await fetch('/api/breaks')
      const data = await response.json()
      
      if (response.ok) {
        setBreakStatus(data)
      } else {
        setError(data.error || 'Failed to load break status')
      }
    } catch (error) {
      console.error('Error loading break status:', error)
      setError('Network error occurred')
    }
  }
  
  const handleBreakAction = async (action, breakType = 'break') => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, breakType })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await loadBreakStatus()
        // Show success message
        const message = action === 'start' 
          ? `${breakType === 'lunch' ? 'Lunch' : 'Break'} started successfully!`
          : `${breakStatus?.currentBreak?.type === 'lunch' ? 'Lunch' : 'Break'} ended successfully!`
        
        // You could replace this with a toast notification
        alert(message)
      } else {
        setError(data.error || `Failed to ${action} break`)
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error with break action:', error)
      setError('Network error occurred')
      alert('Network error occurred')
    }
    
    setLoading(false)
  }
  
  const getBreakDuration = (startTime) => {
    const now = currentTime
    const start = new Date(startTime)
    const diffMinutes = Math.floor((now - start) / (1000 * 60))
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }
  
  const getBreakTypeIcon = (type) => {
    return type === 'lunch' ? (
      <UtensilsCrossed className="w-5 h-5" />
    ) : (
      <Coffee className="w-5 h-5" />
    )
  }
  
  const getBreakTypeColor = (type) => {
    return type === 'lunch' 
      ? 'from-orange-100 to-orange-200 text-orange-800 border-orange-300'
      : 'from-blue-100 to-blue-200 text-blue-800 border-blue-300'
  }
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const getTotalBreakTime = () => {
    if (!breakStatus?.todayBreaks) return 0
    return breakStatus.todayBreaks.reduce((total, breakItem) => total + (breakItem.duration || 0), 0)
  }
  
  if (!breakStatus && !error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Coffee className="w-6 h-6 text-blue-600" />
          Break Management
        </h3>
        <button
          onClick={loadBreakStatus}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh break status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {breakStatus?.onBreak ? (
        <div className="space-y-4">
          {/* Currently on Break */}
          <div className={`bg-gradient-to-r ${getBreakTypeColor(breakStatus.currentBreak.type)} rounded-xl p-4 border`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getBreakTypeIcon(breakStatus.currentBreak.type)}
                <span className="font-bold capitalize">
                  On {breakStatus.currentBreak.type}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {getBreakDuration(breakStatus.currentBreak.startTime)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="opacity-75">Started:</span>
                <div className="font-medium">{formatTime(breakStatus.currentBreak.startTime)}</div>
              </div>
              <div>
                <span className="opacity-75">Type:</span>
                <div className="font-medium capitalize">{breakStatus.currentBreak.type}</div>
              </div>
            </div>
          </div>
          
          {/* End Break Button */}
          <button
            onClick={() => handleBreakAction('end')}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white py-4 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            End {breakStatus.currentBreak.type === 'lunch' ? 'Lunch' : 'Break'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Start Break Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleBreakAction('start', 'break')}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 text-white py-4 px-4 rounded-xl font-bold transition-all duration-200 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Coffee className="w-5 h-5" />
                  <span className="text-sm">Start Break</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => handleBreakAction('start', 'lunch')}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white py-4 px-4 rounded-xl font-bold transition-all duration-200 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UtensilsCrossed className="w-5 h-5" />
                  <span className="text-sm">Start Lunch</span>
                </>
              )}
            </button>
          </div>
          
          {/* Today's Breaks History */}
          {breakStatus?.todayBreaks && breakStatus.todayBreaks.length > 0 ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Today's Breaks ({breakStatus.todayBreaks.length}):
              </h4>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {breakStatus.todayBreaks.map((breakItem, index) => (
                  <div key={index} className="flex items-center justify-between text-black p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      {getBreakTypeIcon(breakItem.type)}
                      <span className="font-medium capitalize text-black">{breakItem.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{breakItem.duration || 0} min</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(breakItem.startTime)} - {breakItem.endTime ? formatTime(breakItem.endTime) : 'Ongoing'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Break Time */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Total Break Time:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {Math.floor(getTotalBreakTime() / 60)}h {getTotalBreakTime() % 60}m
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* No Breaks Today */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Coffee className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No breaks taken today</p>
              <p className="text-gray-400 text-sm mt-1">Start your first break above</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}