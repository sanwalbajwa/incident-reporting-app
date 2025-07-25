// Update: src/app/api/checkin/photo/route.js
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckIn } from '@/models/CheckIn'
import { File } from '@/models/File'

export async function POST(request) {
  console.log('=== CHECKIN PHOTO API DEBUG START ===')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('No session found')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session user:', session.user.id)

    const formData = await request.formData()
    const photo = formData.get('photo')
    const type = formData.get('type') // 'checkin' or 'checkout'
    
    console.log('Photo upload request - type:', type)
    console.log('Photo details:', {
      name: photo?.name || 'unknown',
      size: photo?.size || 0,
      type: photo?.type || 'unknown',
      isFile: photo instanceof File,
      constructor: photo?.constructor?.name,
      hasArrayBuffer: typeof photo?.arrayBuffer === 'function'
    })
    
    if (!photo || typeof photo.arrayBuffer !== 'function') {
      console.log('No valid photo file provided')
      return Response.json({ error: 'No photo file provided' }, { status: 400 })
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
      console.log('Invalid file type:', photo.type)
      return Response.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (photo.size > 5 * 1024 * 1024) {
      console.log('File too large:', photo.size)
      return Response.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const guardId = session.user.id
      const fileExtension = photo.name?.split('.').pop() || 'jpg'
      const fileName = `${type}_${guardId}_${timestamp}.${fileExtension}`
      const filePath = `/checkin/${fileName}`
      
      console.log('Generated file path:', filePath)
      
      // Convert photo to base64 for database storage
      console.log('Converting photo to base64...')
      const buffer = await photo.arrayBuffer()
      const base64Data = Buffer.from(buffer).toString('base64')
      
      console.log('Base64 conversion complete. Original size:', photo.size, 'Base64 size:', base64Data.length)
      
      // Store photo data in database
      console.log('Storing photo in database...')
      const fileRecord = await File.create({
        originalName: photo.name || `${type}-photo.jpg`,
        fileName: fileName,
        filePath: filePath,
        mimeType: photo.type,
        size: photo.size,
        data: base64Data,
        uploadedBy: session.user.id,
        category: 'checkin',
        type: type
      })
      
      console.log('Photo stored in database with ID:', fileRecord._id)
      
      // Get current active shift
      console.log('Finding active shift...')
      const activeShift = await CheckIn.getActiveShift(session.user.id)
      
      if (activeShift) {
        console.log('Active shift found:', activeShift._id)
        
        // Update shift with photo information
        const photoData = {
          originalName: photo.name || `${type}-photo.jpg`,
          fileName: fileName,
          fileSize: photo.size,
          fileType: photo.type,
          filePath: `/upload_dir${filePath}`, // Use the upload_dir route
          fileId: fileRecord._id.toString(),
          uploadedAt: new Date(),
          type: type // 'checkin' or 'checkout'
        }
        
        console.log('Photo data to save in shift:', photoData)
        
        // Add photo to the shift record
        const updateField = type === 'checkin' ? 'checkInPhoto' : 'checkOutPhoto'
        console.log('Updating shift field:', updateField)
        
        const updateResult = await CheckIn.updateShiftPhoto(activeShift._id, updateField, photoData)
        console.log('Shift update result:', updateResult)
      } else {
        console.log('No active shift found - this might be okay if shift just started')
      }
      
      console.log('=== CHECKIN PHOTO API DEBUG END ===')
      
      return Response.json({
        message: 'Photo uploaded successfully',
        photoPath: `/upload_dir${filePath}`,
        debug: {
          fileId: fileRecord._id.toString(),
          filePath: filePath,
          originalSize: photo.size,
          base64Size: base64Data.length
        }
      })
    } catch (uploadError) {
      console.error('Database photo storage error:', uploadError)
      return Response.json(
        { error: 'Failed to store photo: ' + uploadError.message },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Photo upload error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}