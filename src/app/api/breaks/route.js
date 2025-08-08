import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckIn } from '@/models/CheckIn'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { action, breakType } = await request.json()
    
    switch (action) {
      case 'start':
        const startResult = await CheckIn.startBreak(session.user.id, breakType)
        return Response.json(startResult)
        
      case 'end':
        const endResult = await CheckIn.endBreak(session.user.id)
        return Response.json(endResult)
        
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
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