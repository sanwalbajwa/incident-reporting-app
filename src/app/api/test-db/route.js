import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    
    // Simple test - just ping the database
    await db.admin().ping()
    
    return Response.json({ 
      success: true, 
      message: 'MongoDB connected successfully' 
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    })
  }
}