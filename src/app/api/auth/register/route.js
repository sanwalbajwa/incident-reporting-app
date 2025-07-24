import bcrypt from 'bcryptjs'
import { User } from '@/models/User'

export async function POST(request) {
  try {
    const { fullName, email, password, role, employeeId, phone } = await request.json()

    // Validation
    if (!fullName || !email || !password || !role) {
      return Response.json(
        { 
          error: 'Full name, email, password, and role are required',
          errorType: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { 
          error: 'Password must be at least 6 characters',
          errorType: 'PASSWORD_TOO_SHORT'
        },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['guard', 'security_supervisor', 'maintenance', 'management']
    if (!validRoles.includes(role)) {
      return Response.json(
        { 
          error: 'Invalid role selected',
          errorType: 'INVALID_ROLE'
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user - this will throw specific errors
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      employeeId: employeeId ? employeeId.trim() : null,
      phone: phone ? phone.trim() : null
    })

    // Remove password from response
    const { password: _, ...userResponse } = newUser

    return Response.json(
      { 
        message: 'User created successfully',
        user: userResponse
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle specific error types
    if (error.message === 'EMAIL_EXISTS') {
      return Response.json(
        { 
          error: 'An account with this email already exists. Please use a different email address.',
          errorType: 'EMAIL_EXISTS'
        },
        { status: 400 }
      )
    }
    
    if (error.message === 'EMPLOYEE_ID_EXISTS') {
      return Response.json(
        { 
          error: 'This Employee ID is already taken. Please try a different Employee ID.',
          errorType: 'EMPLOYEE_ID_EXISTS'
        },
        { status: 400 }
      )
    }
    
    // Generic error for unexpected issues
    return Response.json(
      { 
        error: 'Failed to create account. Please try again.',
        errorType: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}