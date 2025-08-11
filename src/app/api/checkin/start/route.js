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

// src/app/api/checkin/end/route.js - Enhanced with location tracking

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckIn } from '@/models/CheckIn'
import { logActivity } from '@/models/ActivityLog'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { notes, locationData } = await request.json()
    
    console.log('End shift request with location:', {
      hasLocationData: !!locationData,
      locationSource: locationData?.source
    })
    
    let shiftDuration = null
    let shiftId = null
    
    try {
      const result = await CheckIn.endShift(session.user.id, notes || '', locationData)
      shiftDuration = result.shiftDuration
      shiftId = result.shiftId
    } catch (error) {
      // Fallback logic with location tracking
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const checkins = db.collection('checkins')
      
      const activeShift = await checkins.findOne({
        guardEmail: session.user.email,
        checkOutTime: null
      })
      
      if (activeShift) {
        const checkOutTime = new Date()
        shiftDuration = Math.round((checkOutTime - activeShift.checkInTime) / (1000 * 60))
        shiftId = activeShift._id.toString()
        
        await checkins.updateOne(
          { _id: activeShift._id },
          {
            $set: {
              checkOutTime,
              status: 'completed',
              shiftDuration,
              notes: notes || '',
              endLocationData: locationData, // NEW: Store end location
              updatedAt: new Date()
            }
          }
        )
      } else {
        throw new Error('No active shift found')
      }
    }
    
    // Log shift end activity with location
    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: 'end_shift',
      category: 'shift',
      details: {
        shiftId: shiftId,
        duration: shiftDuration ? `${Math.floor(shiftDuration / 60)}h ${shiftDuration % 60}m` : 'Unknown',
        notes: notes || 'No notes',
        endTime: new Date().toISOString(),
        hasLocationData: !!locationData,
        locationSource: locationData?.source
      },
      request,
      locationData: locationData // NEW: Include location data in activity log
    })
    
    return Response.json({
      message: 'Shift ended successfully'
    })
    
  } catch (error) {
    console.error('End shift error:', error)
    
    // Log failed shift end with location if available
    try {
      const session = await getServerSession(authOptions)
      if (session) {
        const { locationData } = await request.json().catch(() => ({}))
        
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userEmail: session.user.email,
          userRole: session.user.role,
          action: 'end_shift_failed',
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