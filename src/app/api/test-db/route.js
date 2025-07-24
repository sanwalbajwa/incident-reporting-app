export async function GET() {
  try {
    // Simple test without MongoDB for now
    return Response.json({ 
      success: true, 
      message: 'API endpoint working - using test database' 
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}