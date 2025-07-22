import { getServerSession } from 'next-auth'
import { CheckIn } from '@/models/CheckIn'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const activeShift = await CheckIn.getActiveShift(session.user.id)
    const history = await CheckIn.getShiftHistory(session.user.id, 5)
    
    return Response.json({
      activeShift,
      history
    })
    
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}