// Create: src/app/api/profile/password/route.js

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

// PUT change password
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { currentPassword, newPassword } = await request.json()
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }
    
    if (newPassword.length < 6) {
      return Response.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }
    
    // Get user with password
    const user = await User.findById(session.user.id)
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isCurrentPasswordValid) {
      return Response.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)
    
    // Update password
    const updateResult = await User.updatePassword(session.user.id, hashedNewPassword)
    
    if (updateResult.matchedCount === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    
    return Response.json({
      message: 'Password changed successfully'
    })
    
  } catch (error) {
    console.error('Change password error:', error)
    return Response.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}