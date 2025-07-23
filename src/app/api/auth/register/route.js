import bcrypt from 'bcryptjs'
import { User } from '@/models/User'

export async function POST(request) {
  try {
    const { fullName, email, password, role, employeeId, phone } = await request.json()

    // Validation
    if (!fullName || !email || !password || !role) {
      return Response.json(
        { error: 'Full name, email, password, and role are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['guard', 'security_supervisor', 'maintenance', 'management']
    if (!validRoles.includes(role)) {
      return Response.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return Response.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role, // Include role
      employeeId,
      phone
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
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}