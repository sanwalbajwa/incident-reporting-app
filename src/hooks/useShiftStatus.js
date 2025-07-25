// Create: src/hooks/useShiftStatus.js
'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useShiftStatus() {
  const { data: session } = useSession()
  const [shiftStatus, setShiftStatus] = useState({
    activeShift: null,
    loading: true,
    error: null
  })

  const loadShiftStatus = async () => {
    if (!session) {
      setShiftStatus({ activeShift: null, loading: false, error: null })
      return
    }

    try {
      const response = await fetch('/api/checkin/status', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setShiftStatus({
          activeShift: data.activeShift,
          loading: false,
          error: null
        })
      } else {
        setShiftStatus({
          activeShift: null,
          loading: false,
          error: data.error || 'Failed to load shift status'
        })
      }
    } catch (error) {
      console.error('Error loading shift status:', error)
      setShiftStatus({
        activeShift: null,
        loading: false,
        error: 'Network error'
      })
    }
  }

  useEffect(() => {
    loadShiftStatus()
  }, [session])

  return {
    ...shiftStatus,
    refetchShiftStatus: loadShiftStatus,
    isOnDuty: !!shiftStatus.activeShift
  }
}