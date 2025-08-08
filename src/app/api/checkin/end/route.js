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
    
    const { notes } = await request.json()
    
    let shiftDuration = null
    let shiftId = null
    
    try {
      await CheckIn.endShift(session.user.id, notes || '')
    } catch (error) {
      // Fallback logic
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
              updatedAt: new Date()
            }
          }
        )
      } else {
        throw new Error('No active shift found')
      }
    }
    
    // Log shift end activity
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
        endTime: new Date().toISOString()
      },
      request
    })
    
    return Response.json({
      message: 'Shift ended successfully'
    })
    
  } catch (error) {
    console.error('End shift error:', error)
    
    // Log failed shift end
    try {
      const session = await getServerSession(authOptions)
      if (session) {
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
          request
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
    return Response.json({ error: error.message }, { status: 400 })
  }
}