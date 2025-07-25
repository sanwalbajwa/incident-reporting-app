// Create this file: src/app/upload_dir/[...path]/route.js (NOT page.js)

import { NextResponse } from 'next/server'
import { File } from '@/models/File'
import clientPromise from '@/lib/mongodb'

export async function GET(request, { params }) {
  try {
    console.log('=== UPLOAD_DIR ROUTE DEBUG ===')
    
    // Await params for Next.js 15
    const resolvedParams = await params
    const filePath = '/' + resolvedParams.path.join('/')
    
    console.log('Requested file path:', filePath)
    console.log('Params:', resolvedParams)
    
    // Security check - prevent directory traversal
    if (filePath.includes('..') || filePath.includes('~')) {
      console.log('Security check failed - directory traversal attempt')
      return new NextResponse('Access denied', { status: 403 })
    }
    
    // Find file in database
    console.log('Querying database for file...')
    const fileRecord = await File.findByPath(filePath)
    
    if (!fileRecord) {
      console.log('File not found in database for path:', filePath)
      
      // Debug: Let's see what files are actually in the database
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const files = db.collection('files')
      const allFiles = await files.find({}).toArray()
      
      console.log('All files in database:')
      allFiles.forEach(file => {
        console.log(' - Path:', file.filePath, 'Name:', file.originalName)
      })
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'File not found',
          message: 'The requested file does not exist in database.',
          requestedPath: filePath,
          availableFiles: allFiles.map(f => f.filePath)
        }), 
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
    
    console.log('File found in database:', fileRecord.originalName)
    
    // Convert base64 data back to buffer
    if (!fileRecord.data) {
      console.log('Error: File record has no data field')
      return new NextResponse('File data missing', { status: 500 })
    }
    
    console.log('Converting base64 to buffer...')
    const fileBuffer = Buffer.from(fileRecord.data, 'base64')
    console.log('Buffer size:', fileBuffer.length)
    
    // Determine content type
    const contentType = fileRecord.mimeType || 'application/octet-stream'
    console.log('Content type:', contentType)
    
    // Return file with appropriate headers
    console.log('Serving file successfully')
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        'Content-Disposition': `inline; filename="${fileRecord.originalName}"`,
        'Last-Modified': fileRecord.updatedAt.toUTCString(),
      },
    })
    
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}