// Create: src/app/api/profile/route.js

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { User } from '@/models/User'

// GET profile data
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await User.findById(session.user.id)
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Remove password from response
    const { password, ...userResponse } = user
    
    return Response.json({ user: userResponse })
    
  } catch (error) {
    console.error('Get profile error:', error)
    return Response.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT update profile data
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { fullName, phone, employeeId } = await request.json()
    
    // Validate required fields
    if (!fullName || fullName.trim() === '') {
      return Response.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }
    
    // Check if employeeId is unique (if provided)
    if (employeeId && employeeId.trim() !== '') {
      const existingUser = await User.findByEmployeeId(employeeId.trim())
      if (existingUser && existingUser._id.toString() !== session.user.id) {
        return Response.json(
          { error: 'This Employee ID is already taken' },
          { status: 400 }
        )
      }
    }
    
    const updateResult = await User.updateProfile(session.user.id, {
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : null,
      employeeId: employeeId ? employeeId.trim() : null
    })
    
    if (updateResult.matchedCount === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    
    return Response.json({
      message: 'Profile updated successfully'
    })
    
  } catch (error) {
    console.error('Update profile error:', error)
    return Response.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}