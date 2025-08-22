// src/app/api/auth/forgot-password/route.js
import { User } from '@/models/User'
import { logActivity } from '@/models/ActivityLog'
import crypto from 'crypto'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return Response.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findByEmail(email)
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return Response.json({
        message: 'If this email exists in our system, you will receive password reset instructions.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    // Store reset token in database
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken: resetToken,
          resetTokenExpiry: resetTokenExpiry,
          updatedAt: new Date()
        }
      }
    )

    // Log password reset request
    await logActivity({
      userId: user._id.toString(),
      userName: user.fullName,
      userEmail: user.email,
      userRole: user.role,
      action: 'password_reset_requested',
      category: 'authentication',
      details: {
        email: email,
        tokenExpiry: resetTokenExpiry.toISOString(),
        requestTime: new Date().toISOString()
      },
      request
    })

    // In production, you would send an email here
    // For now, we'll return the reset link in the response
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    
    // TODO: Replace this with actual email sending service
    console.log('Password reset requested for:', email)
    console.log('Reset URL (in production, this would be emailed):', resetUrl)

    // For development/demo purposes, return the reset URL
    // In production, remove this and only send via email
    return Response.json({
      message: 'Password reset instructions have been sent to your email.',
      // Remove this in production:
      resetUrl: resetUrl,
      // Remove this in production:
      note: 'In development mode: Use the resetUrl above. In production, this would be sent via email.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    
    // Log failed password reset attempt
    try {
      await logActivity({
        userId: null,
        userName: null,
        userEmail: email || null,
        userRole: null,
        action: 'password_reset_failed',
        category: 'authentication',
        details: {
          error: error.message,
          email: email || 'unknown',
          timestamp: new Date().toISOString()
        },
        request
      })
    } catch (logError) {
      console.error('Failed to log password reset error:', logError)
    }
    
    return Response.json(
      { error: 'Failed to process password reset request. Please try again.' },
      { status: 500 }
    )
  }
}