import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckIn } from '@/models/CheckIn'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const photo = formData.get('photo')
    const type = formData.get('type') // 'checkin' or 'checkout'
    
    console.log('Photo upload request - type:', type)
    console.log('Photo file:', photo ? photo.name : 'No file')
    
    if (!photo || !(photo instanceof File)) {
      return Response.json({ error: 'No photo file provided' }, { status: 400 })
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
      return Response.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (photo.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Create uploads directory for checkin photos
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'checkin')
    try {
      await fs.mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      console.log('Directory already exists or created')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const guardId = session.user.id
    const fileExtension = path.extname(photo.name)
    const fileName = `${type}_${guardId}_${timestamp}${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)
    
    // Save file
    const buffer = await photo.arrayBuffer()
    await fs.writeFile(filePath, Buffer.from(buffer))
    
    // Get current active shift
    const activeShift = await CheckIn.getActiveShift(session.user.id)
    
    if (activeShift) {
      // Update shift with photo information
      const photoData = {
        originalName: photo.name,
        fileName: fileName,
        fileSize: photo.size,
        fileType: photo.type,
        filePath: `/uploads/checkin/${fileName}`,
        uploadedAt: new Date(),
        type: type // 'checkin' or 'checkout'
      }
      
      // Add photo to the shift record
      const updateField = type === 'checkin' ? 'checkInPhoto' : 'checkOutPhoto'
      await CheckIn.updateShiftPhoto(activeShift._id, updateField, photoData)
    }
    
    return Response.json({
      message: 'Photo uploaded successfully',
      photoPath: `/uploads/checkin/${fileName}`
    })
    
  } catch (error) {
    console.error('Photo upload error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}