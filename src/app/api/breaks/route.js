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
    
    const { action, breakType } = await request.json()
    
    let result
    let activityAction
    let activityDetails = {}
    
    switch (action) {
      case 'start':
        result = await CheckIn.startBreak(session.user.id, breakType)
        activityAction = breakType === 'lunch' ? 'start_lunch' : 'start_break'
        activityDetails = {
          breakType,
          startTime: new Date().toISOString()
        }
        break
        
      case 'end':
        const breakStatus = await CheckIn.getBreakStatus(session.user.id)
        const currentBreakType = breakStatus.currentBreak?.type || 'break'
        
        result = await CheckIn.endBreak(session.user.id)
        activityAction = currentBreakType === 'lunch' ? 'end_lunch' : 'end_break'
        activityDetails = {
          breakType: currentBreakType,
          duration: result.duration ? `${result.duration} minutes` : 'Unknown',
          endTime: new Date().toISOString()
        }
        break
        
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Log break activity
    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: activityAction,
      category: 'break',
      details: activityDetails,
      request
    })
    
    return Response.json(result)
    
  } catch (error) {
    console.error('Break action error:', error)
    
    // Log failed break action
    try {
      const session = await getServerSession(authOptions)
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userEmail: session.user.email,
          userRole: session.user.role,
          action: `${action}_break_failed`,
          category: 'break',
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

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const status = await CheckIn.getBreakStatus(session.user.id)
    return Response.json(status)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}