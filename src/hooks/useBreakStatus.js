// Create: src/hooks/useBreakStatus.js
'use client'
import { useState, useEffect } from 'react'

export function useBreakStatus() {
  const [breakStatus, setBreakStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  const startBreak = async (breakType = 'break') => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', breakType })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await loadBreakStatus() // Refresh status
        return { success: true, message: data.message }
      } else {
        setError(data.error || 'Failed to start break')
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error starting break:', error)
      setError('Network error occurred')
      return { success: false, error: 'Network error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const endBreak = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await loadBreakStatus() // Refresh status
        return { success: true, message: data.message }
      } else {
        setError(data.error || 'Failed to end break')
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error ending break:', error)
      setError('Network error occurred')
      return { success: false, error: 'Network error occurred' }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBreakStatus()
    
    // Auto-refresh break status every 30 seconds
    const interval = setInterval(loadBreakStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    breakStatus,
    loading,
    error,
    startBreak,
    endBreak,
    refreshStatus: loadBreakStatus
  }
}