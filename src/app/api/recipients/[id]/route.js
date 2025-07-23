import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET specific recipient by ID
export async function GET(request, { params }) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    let recipient = null
    
    try {
      // Try to find by ObjectId first
      recipient = await users.findOne(
        { 
          _id: new ObjectId(resolvedParams.id),
          role: { 
            $in: ['security_supervisor', 'maintenance', 'management'] 
          },
          isActive: true 
        },
        { 
          projection: { 
            _id: 1, 
            fullName: 1, 
            email: 1, 
            role: 1 
          } 
        }
      )
    } catch (error) {
      // If ObjectId conversion fails, it might be a role string
      console.log('Not a valid ObjectId, checking for role string')
    }
    
    if (!recipient) {
      // Fallback: check if it's a role string
      const roleId = resolvedParams.id
      if (['security_supervisor', 'maintenance', 'management'].includes(roleId)) {
        return Response.json({
          recipient: {
            _id: roleId,
            name: formatRole(roleId),
            role: formatRole(roleId),
            email: null,
            isRoleFallback: true
          }
        })
      }
      
      return Response.json({ error: 'Recipient not found' }, { status: 404 })
    }
    
    // Format the response
    const formattedRecipient = {
      _id: recipient._id,
      name: recipient.fullName,
      email: recipient.email,
      role: formatRole(recipient.role),
      isRoleFallback: false
    }
    
    return Response.json({ recipient: formattedRecipient })
    
  } catch (error) {
    console.error('Get recipient error:', error)
    return Response.json(
      { error: 'Failed to fetch recipient' },
      { status: 500 }
    )
  }
}

// Helper function to format role names
function formatRole(role) {
  switch (role) {
    case 'security_supervisor':
      return 'Security Supervisor'
    case 'maintenance':
      return 'Maintenance Team'
    case 'management':
      return 'Management'
    default:
      return role
  }
}