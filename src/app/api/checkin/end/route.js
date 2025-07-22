import { getServerSession } from 'next-auth'
import { CheckIn } from '@/models/CheckIn'

export async function POST(request) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { notes } = await request.json()
    
    await CheckIn.endShift(session.user.id, notes || '')
    
    return Response.json({
      message: 'Shift ended successfully'
    })
    
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    )
  }
}