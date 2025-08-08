'use client'
import { useState, useEffect } from 'react'
import { Coffee, Clock, Play, Square } from 'lucide-react'

export default function BreakManager() {
  const [breakStatus, setBreakStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    loadBreakStatus()
  }, [])
  
  const loadBreakStatus = async () => {
    try {
      const response = await fetch('/api/breaks')
      const data = await response.json()
      setBreakStatus(data)
    } catch (error) {
      console.error('Error loading break status:', error)
    }
  }
  
  const handleBreakAction = async (action, breakType = 'break') => {
    setLoading(true)
    try {
      const response = await fetch('/api/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, breakType })
      })
      
      const data = await response.json()
      if (response.ok) {
        await loadBreakStatus()
        alert(data.message)
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setLoading(false)
  }
  
  if (!breakStatus) return <div>Loading...</div>
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Coffee className="w-6 h-6 text-blue-600" />
        Break Management
      </h3>
      
      {breakStatus.onBreak ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-bold">Currently on {breakStatus.currentBreak.type}</span>
            </div>
            <p className="text-amber-700">
              Started: {new Date(breakStatus.currentBreak.startTime).toLocaleTimeString()}
            </p>
          </div>
          
          <button
            onClick={() => handleBreakAction('end')}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Square className="w-5 h-5" />
            End Break
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleBreakAction('start', 'break')}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Break
            </button>
            
            <button
              onClick={() => handleBreakAction('start', 'lunch')}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Coffee className="w-4 h-4" />
              Start Lunch
            </button>
          </div>
          
          {breakStatus.todayBreaks.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-2">Today's Breaks:</h4>
              {breakStatus.todayBreaks.map((breakItem, index) => (
                <div key={index} className="text-sm text-gray-600 flex justify-between">
                  <span>{breakItem.type}</span>
                  <span>{breakItem.duration} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}