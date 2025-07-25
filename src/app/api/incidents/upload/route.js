import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { File } from '@/models/File'

export async function POST(request) {
  console.log('=== UPLOAD API DEBUG START ===')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('No session found')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session user:', session.user.id)

    const formData = await request.formData()
    const incidentId = formData.get('incidentId')
    const files = formData.getAll('files')
    
    console.log('Upload request - incidentId:', incidentId)
    console.log('Files received:', files.length)
    
    // Enhanced file debugging
    files.forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        isFile: file instanceof File,
        constructor: file.constructor.name,
        hasArrayBuffer: typeof file.arrayBuffer === 'function',
        isFormDataFile: file.constructor.name === 'File'
      })
    })
    
    if (!incidentId) {
      console.log('No incident ID provided')
      return Response.json({ error: 'Incident ID is required' }, { status: 400 })
    }

    // Verify incident belongs to current user
    console.log('Verifying incident ownership...')
    const incident = await Incident.findById(incidentId)
    
    if (!incident) {
      console.log('Incident not found:', incidentId)
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }
    
    console.log('Incident found. Guard ID:', incident.guardId?.toString())
    console.log('Current user ID:', session.user.id)
    
    if (incident.guardId.toString() !== session.user.id) {
      console.log('Access denied - user does not own this incident')
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const attachments = []
    
    if (files && files.length > 0) {
      console.log('Processing', files.length, 'files...')
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`\n--- Processing file ${i + 1}: ${file.name} ---`)
        
        // FIXED: More flexible file detection
        const isValidFile = file && 
                          file.name && 
                          file.size > 0 && 
                          typeof file.arrayBuffer === 'function'
        
        console.log('File validation:', {
          hasName: !!file.name,
          hasSize: file.size > 0,
          hasArrayBuffer: typeof file.arrayBuffer === 'function',
          isValid: isValidFile
        })
        
        if (isValidFile) {
          // Validate file size (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            console.log('File too large:', file.name, file.size)
            continue
          }

          try {
            // Generate unique filename and path
            const timestamp = Date.now()
            const randomString = Math.random().toString(36).substring(2, 15)
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const fileExtension = sanitizedName.split('.').pop()
            const baseName = sanitizedName.replace(`.${fileExtension}`, '')
            const fileName = `${timestamp}_${randomString}_${baseName}.${fileExtension}`
            const filePath = `/incidents/${fileName}`
            
            console.log('Generated file path:', filePath)
            
            // Convert file to base64 for database storage
            console.log('Converting file to base64...')
            const buffer = await file.arrayBuffer()
            const base64Data = Buffer.from(buffer).toString('base64')
            
            console.log('Base64 conversion complete. Original size:', file.size, 'Base64 size:', base64Data.length)
            
            // Store file data in database
            console.log('Storing file in database...')
            const fileRecord = await File.create({
              originalName: file.name,
              fileName: fileName,
              filePath: filePath,
              mimeType: file.type,
              size: file.size,
              data: base64Data, // Store file as base64
              incidentId: incidentId,
              uploadedBy: session.user.id,
              category: 'incident'
            })
            
            console.log('File stored with ID:', fileRecord._id)
            
            // Store file info for incident
            attachments.push({
              originalName: file.name,
              fileName: fileName,
              fileSize: file.size,
              fileType: file.type,
              filePath: `/upload_dir${filePath}`, // Use the upload_dir route
              fileId: fileRecord._id.toString(),
              uploadedAt: new Date()
            })
            
            console.log('File processed successfully:', file.name)
          } catch (fileError) {
            console.error('Error storing file:', file.name, fileError)
            // Continue with other files even if one fails
          }
        } else {
          console.log('Skipping invalid file:', {
            name: file?.name || 'unknown',
            size: file?.size || 0,
            hasArrayBuffer: typeof file?.arrayBuffer === 'function'
          })
        }
      }
    } else {
      console.log('No files provided or files array is empty')
    }
    
    console.log('Total attachments processed:', attachments.length)
    
    // Update incident with new attachments (append to existing ones)
    if (attachments.length > 0) {
      console.log('Updating incident with attachments...')
      const existingAttachments = incident.attachments || []
      const updatedAttachments = [...existingAttachments, ...attachments]
      
      const updateResult = await Incident.updateIncident(incidentId, { attachments: updatedAttachments })
      console.log('Incident update result:', updateResult)
      
      console.log('Updated incident with', attachments.length, 'new attachments')
    }
    
    console.log('=== UPLOAD API DEBUG END ===')
    
    return Response.json({
      message: 'Files uploaded successfully',
      attachments,
      uploadedCount: attachments.length,
      debug: {
        filesReceived: files.length,
        filesProcessed: attachments.length,
        incidentId: incidentId
      }
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json(
      { 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}