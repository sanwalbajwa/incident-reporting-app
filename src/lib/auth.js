// src/lib/auth.js - Enhanced with device detection

import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { User } from '@/models/User'
import { isAllowedDevice, getDeviceInfo } from '@/lib/deviceDetection'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        try {
          console.log('=== AUTH WITH DEVICE DETECTION DEBUG START ===')
          console.log('Login attempt for email:', credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials')
            return null
          }

          // Get user agent from request headers
          const userAgent = req.headers?.['user-agent'] || ''
          console.log('User Agent:', userAgent)
          
          // Get device information
          const deviceInfo = getDeviceInfo(userAgent)
          console.log('Device Info:', deviceInfo)
          
          // Check if device is allowed (block mobile phones)
          if (!deviceInfo.isAllowed) {
            console.log('Device blocked:', deviceInfo.deviceType)
            // Return a special error object that can be handled by callbacks
            throw new Error(`DEVICE_BLOCKED:${deviceInfo.deviceType}`)
          }

          // Continue with normal authentication
          const user = await User.findByEmail(credentials.email)
          console.log('User found:', !!user)
          
          if (!user) {
            console.log('No user found with email:', credentials.email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )
          console.log('Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('Invalid password')
            return null
          }

          // Log successful login with device info
          console.log('Authentication successful for:', user.email)
          console.log('Device type allowed:', deviceInfo.deviceType)
          
          // Update user's last login
          await User.updateLastLogin(user._id.toString())
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            role: user.role,
            deviceType: deviceInfo.deviceType // Include device type in session
          }
        } catch (error) {
          console.error('Auth error:', error)
          
          // Handle device blocking errors specifically
          if (error.message.startsWith('DEVICE_BLOCKED:')) {
            const deviceType = error.message.split(':')[1]
            console.log('Blocking device type:', deviceType)
            // This error will be caught by the error callback
            throw error
          }
          
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.deviceType = user.deviceType
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.deviceType = token.deviceType
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: true,
}