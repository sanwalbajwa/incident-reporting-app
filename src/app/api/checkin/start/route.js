// src/app/api/checkin/start/route.js - Enhanced with location tracking

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckIn } from '@/models/CheckIn'
import { logActivity } from '@/models/ActivityLog'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { location, notes, locationData } = await request.json()
    
    console.log('Start shift request with location:', {
      hasLocationData: !!locationData,
      location: location,
      locationSource: locationData?.source
    })
    
    const shift = await CheckIn.startShift(
      session.user.id,
      session.user.name,
      session.user.email,
      location,
      notes,
      locationData // NEW: Pass location data to CheckIn model
    )
    
    // Log shift start activity with location
    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: 'start_shift',
      category: 'shift',
      details: {
        shiftId: shift._id.toString(),
        location: location || 'Not specified',
        notes: notes || 'No notes',
        startTime: new Date().toISOString(),
        hasLocationData: !!locationData,
        locationSource: locationData?.source
      },
      request,
      locationData: locationData // NEW: Include location data in activity log
    })
    
    return Response.json({
      message: 'Shift started successfully',
      shift
    })
    
  } catch (error) {
    console.error('Start shift error:', error)
    
    // Log failed shift start with location if available
    try {
      const session = await getServerSession(authOptions)
      if (session) {
        const { locationData } = await request.json().catch(() => ({}))
        
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userEmail: session.user.email,
          userRole: session.user.role,
          action: 'start_shift_failed',
          category: 'shift',
          details: {
            error: error.message,
            timestamp: new Date().toISOString()
          },
          request,
          locationData: locationData // NEW: Include location data even for failed attempts
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
    return Response.json({ error: error.message }, { status: 400 })
  }
}