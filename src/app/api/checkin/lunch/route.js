import { getServerSession } from 'next-auth'
import { CheckIn } from '@/models/CheckIn'

export async function POST(request) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { action } = await request.json() // 'start' or 'end'
    
    if (action === 'start') {
      await CheckIn.startLunchBreak(session.user.id)
      return Response.json({ message: 'Lunch break started' })
    } else if (action === 'end') {
      await CheckIn.endLunchBreak(session.user.id)
      return Response.json({ message: 'Lunch break ended' })
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    )
  }
}