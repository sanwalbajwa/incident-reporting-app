import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request, { params }) {
  try {
    // Await params for Next.js 15
    const resolvedParams = await params
    const filePath = resolvedParams.path.join('/')
    
    // Security check - prevent directory traversal
    if (filePath.includes('..') || filePath.includes('~')) {
      return new NextResponse('Access denied', { status: 403 })
    }
    
    // Construct full file path
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath)
    
    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch {
      console.log('File not found:', fullPath)
      return new NextResponse('File not found', { status: 404 })
    }
    
    // Read file
    const fileBuffer = await fs.readFile(fullPath)
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase()
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.txt': 'text/plain',
    }
    
    const contentType = contentTypes[ext] || 'application/octet-stream'
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Disposition': 'inline', // Display in browser if possible
      },
    })
    
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}