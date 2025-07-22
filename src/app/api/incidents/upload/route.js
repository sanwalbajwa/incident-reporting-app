import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { promises as fs } from 'fs'
import path from 'path'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const incidentId = formData.get('incidentId')
    const files = formData.getAll('files')
    
    console.log('Upload request - incidentId:', incidentId)
    console.log('Files count:', files.length)
    
    if (!incidentId) {
      return Response.json({ error: 'Incident ID is required' }, { status: 400 })
    }

    // Verify incident belongs to current user
    const incident = await Incident.findById(incidentId)
    if (!incident || incident.guardId.toString() !== session.user.id) {
      return Response.json({ error: 'Incident not found or access denied' }, { status: 403 })
    }

    const attachments = []
    
    if (files && files.length > 0) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'incidents')
      try {
        await fs.mkdir(uploadsDir, { recursive: true })
      } catch (error) {
        console.log('Directory already exists')
      }

      for (const file of files) {
        if (file instanceof File && file.size > 0) {
          // Generate unique filename
          const timestamp = Date.now()
          const randomString = Math.random().toString(36).substring(2, 15)
          const fileExtension = path.extname(file.name)
          const fileName = `${timestamp}_${randomString}${fileExtension}`
          const filePath = path.join(uploadsDir, fileName)
          
          // Save file
          const buffer = await file.arrayBuffer()
          await fs.writeFile(filePath, Buffer.from(buffer))
          
          // Store file info
          attachments.push({
            originalName: file.name,
            fileName: fileName,
            fileSize: file.size,
            fileType: file.type,
            filePath: `/uploads/incidents/${fileName}`,
            uploadedAt: new Date()
          })
        }
      }
    }
    
    // Update incident with new attachments (append to existing ones)
    if (attachments.length > 0) {
      const existingAttachments = incident.attachments || []
      const updatedAttachments = [...existingAttachments, ...attachments]
      await Incident.updateIncident(incidentId, { attachments: updatedAttachments })
    }
    
    return Response.json({
      message: 'Files uploaded successfully',
      attachments
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}