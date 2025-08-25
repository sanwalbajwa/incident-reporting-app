// Create: src/app/api/recipients/[id]/route.js

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { User } from '@/models/User'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Await params for Next.js 15
    const { id } = await params
    
    console.log('Looking for recipient with ID:', id)
    
    // Find the user by ID
    const user = await User.findById(id)
    
    if (!user) {
      console.log('Recipient not found with ID:', id)
      return Response.json({ error: 'Recipient not found' }, { status: 404 })
    }
    
    // Return recipient information
    const recipient = {
      _id: user._id.toString(),
      name: user.fullName,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      isActive: user.isActive
    }
    
    console.log('Found recipient:', recipient)
    
    return Response.json({ recipient })
    
  } catch (error) {
    console.error('Error fetching recipient:', error)
    return Response.json(
      { error: 'Failed to fetch recipient' },
      { status: 500 }
    )
  }
}