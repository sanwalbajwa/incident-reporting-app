import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const incidentData = await request.json()
    
    // Validate required fields
    const required = ['recipientId', 'clientId', 'incidentType', 'description', 'incidentDate']
    for (const field of required) {
      if (!incidentData[field]) {
        return Response.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Determine if this is a communication or incident
    const isCommunication = incidentData.incidentType === 'Communication/Message'
    
    // Add guard and recipient information
    const completeIncidentData = {
      ...incidentData,
      guardId: new ObjectId(session.user.id),
      guardName: session.user.name,
      guardEmail: session.user.email,
      recipientId: incidentData.recipientId,
      messageType: incidentData.messageType || (isCommunication ? 'communication' : 'incident'),
      priority: incidentData.priority || 'normal',
      attachments: [] // Initialize empty - files will be uploaded separately
    }
    
    console.log('Creating incident/communication with data:', completeIncidentData)
    
    const incident = await Incident.create(completeIncidentData)
    
    // Return success with incident ID for file uploads
    const message = isCommunication 
      ? 'Message sent successfully to headquarters'
      : 'Incident reported successfully'
    
    return Response.json({
      message,
      incident: {
        ...incident,
        _id: incident._id.toString() // Ensure ID is string for frontend
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create incident/communication error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 5. Debug route to check file system: src/app/api/debug/files/route.js  
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    
    async function getDirectoryContents(dirPath) {
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true })
        const contents = []
        
        for (const item of items) {
          const fullPath = path.join(dirPath, item.name)
          if (item.isDirectory()) {
            const subContents = await getDirectoryContents(fullPath)
            contents.push({
              name: item.name,
              type: 'directory',
              path: fullPath.replace(process.cwd(), ''),
              contents: subContents
            })
          } else {
            const stats = await fs.stat(fullPath)
            contents.push({
              name: item.name,
              type: 'file',
              path: fullPath.replace(process.cwd(), ''),
              size: stats.size,
              created: stats.birthtime
            })
          }
        }
        return contents
      } catch (error) {
        return { error: error.message }
      }
    }
    
    const contents = await getDirectoryContents(uploadsDir)
    
    return Response.json({
      uploadsDirectory: uploadsDir.replace(process.cwd(), ''),
      contents,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV
    })
    
  } catch (error) {
    return Response.json({
      error: error.message,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV
    })
  }
}