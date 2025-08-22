// src/app/api/auth/reset-password/route.js
import bcrypt from 'bcryptjs'
import { logActivity } from '@/models/ActivityLog'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { token, password } = await request.json()
    
    if (!token || !password) {
      return Response.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')

    // Find user with valid reset token
    const user = await users.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
      isActive: true
    })

    if (!user) {
      // Log invalid reset attempt
      await logActivity({
        userId: null,
        userName: null,
        userEmail: null,
        userRole: null,
        action: 'password_reset_invalid_token',
        category: 'authentication',
        details: {
          token: token.substring(0, 8) + '...', // Log partial token for security
          timestamp: new Date().toISOString()
        },
        request
      })

      return Response.json(
        { error: 'Invalid or expired reset token. Please request a new password reset.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset token
    const updateResult = await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: ""
        }
      }
    )

    if (updateResult.modifiedCount === 0) {
      return Response.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful password reset
    await logActivity({
      userId: user._id.toString(),
      userName: user.fullName,
      userEmail: user.email,
      userRole: user.role,
      action: 'password_reset_completed',
      category: 'authentication',
      details: {
        resetTime: new Date().toISOString(),
        tokenUsed: token.substring(0, 8) + '...' // Log partial token
      },
      request
    })

    return Response.json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    
    return Response.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    )
  }
}