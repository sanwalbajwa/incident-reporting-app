import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { promises as fs } from 'fs'
import path from 'path'

export async function DELETE(request, { params }) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { attachmentIndex } = await request.json()
    
    // Get incident
    const incident = await Incident.findById(resolvedParams.id)
    
    if (!incident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }
    
    // Check ownership
    if (incident.guardId.toString() !== session.user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Check if incident can be edited
    if (incident.status !== 'submitted') {
      return Response.json({ 
        error: 'Cannot edit incident that has already been reviewed' 
      }, { status: 400 })
    }
    
    // Remove attachment from array
    const attachments = incident.attachments || []
    
    if (attachmentIndex >= 0 && attachmentIndex < attachments.length) {
      const attachmentToRemove = attachments[attachmentIndex]
      
      // Try to delete physical file
      try {
        const fullPath = path.join(process.cwd(), 'public', attachmentToRemove.filePath)
        await fs.unlink(fullPath)
      } catch (error) {
        console.log('File already deleted or not found:', error.message)
      }
      
      // Remove from array
      attachments.splice(attachmentIndex, 1)
      
      // Update incident
      await Incident.updateIncident(resolvedParams.id, { attachments })
    }
    
    return Response.json({ message: 'Attachment removed successfully' })
    
  } catch (error) {
    console.error('Remove attachment error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}