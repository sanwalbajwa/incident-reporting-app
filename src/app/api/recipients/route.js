// src/app/api/recipients/route.js - Updated to remove maintenance role

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

// GET all available recipients (supervisors, management) - MAINTENANCE REMOVED
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    // Get all users who can receive messages (excluding guards and maintenance)
    const recipients = await users
      .find({ 
        role: { 
          $in: ['security_supervisor', 'management'] // REMOVED 'maintenance'
        },
        isActive: true 
      })
      .project({ 
        _id: 1, 
        fullName: 1, 
        email: 1, 
        role: 1 
      })
      .sort({ role: 1, fullName: 1 })
      .toArray()
    
    // Format the response for better UX
    const formattedRecipients = recipients.map(recipient => ({
      _id: recipient._id,
      name: recipient.fullName,
      email: recipient.email,
      role: formatRole(recipient.role)
    }))
    
    return Response.json({ recipients: formattedRecipients })
    
  } catch (error) {
    console.error('Get recipients error:', error)
    return Response.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    )
  }
}

// Helper function to format role names - UPDATED to remove maintenance
function formatRole(role) {
  switch (role) {
    case 'security_supervisor':
      return 'Security Supervisor'
    case 'management':
      return 'Management'
    default:
      return role
  }
}