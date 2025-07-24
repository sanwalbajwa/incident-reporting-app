import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { promises as fs } from 'fs'
import path from 'path'

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
      // Create uploads directory structure
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'incidents')
      
      try {
        await fs.mkdir(uploadsDir, { recursive: true })
        console.log('Created/verified uploads directory:', uploadsDir)
      } catch (error) {
        console.log('Directory creation error (may already exist):', error.message)
      }

      for (const file of files) {
        if (file instanceof File && file.size > 0) {
          // Validate file size (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            console.log('File too large:', file.name, file.size)
            continue
          }

          // Generate unique filename with timestamp and random string
          const timestamp = Date.now()
          const randomString = Math.random().toString(36).substring(2, 15)
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize filename
          const fileExtension = path.extname(sanitizedName)
          const baseName = path.basename(sanitizedName, fileExtension)
          const fileName = `${timestamp}_${randomString}_${baseName}${fileExtension}`
          const filePath = path.join(uploadsDir, fileName)
          
          try {
            // Save file
            const buffer = await file.arrayBuffer()
            await fs.writeFile(filePath, Buffer.from(buffer))
            
            console.log('File saved successfully:', filePath)
            
            // Store file info with absolute web path
            attachments.push({
              originalName: file.name,
              fileName: fileName,
              fileSize: file.size,
              fileType: file.type,
              filePath: `/api/uploads/incidents/${fileName}`, // Use API route path
              uploadedAt: new Date()
            })
          } catch (fileError) {
            console.error('Error saving file:', file.name, fileError)
            // Continue with other files even if one fails
          }
        }
      }
    }
    
    // Update incident with new attachments (append to existing ones)
    if (attachments.length > 0) {
      const existingAttachments = incident.attachments || []
      const updatedAttachments = [...existingAttachments, ...attachments]
      await Incident.updateIncident(incidentId, { attachments: updatedAttachments })
      
      console.log('Updated incident with attachments:', attachments.length)
    }
    
    return Response.json({
      message: 'Files uploaded successfully',
      attachments,
      uploadedCount: attachments.length
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}