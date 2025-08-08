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
    
    const { location, notes } = await request.json()
    
    const shift = await CheckIn.startShift(
      session.user.id,
      session.user.name,
      session.user.email,
      location,
      notes
    )
    
    // Log shift start activity
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
        startTime: new Date().toISOString()
      },
      request
    })
    
    return Response.json({
      message: 'Shift started successfully',
      shift
    })
    
  } catch (error) {
    console.error('Start shift error:', error)
    
    // Log failed shift start
    try {
      const session = await getServerSession(authOptions)
      if (session) {
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
          request
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
    return Response.json({ error: error.message }, { status: 400 })
  }
}