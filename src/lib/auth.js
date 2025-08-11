// src/lib/auth.js - Updated with location tracking

import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { User } from '@/models/User'
import { isAllowedDevice, getDeviceInfo } from '@/lib/deviceDetection'
import { logActivity } from '@/models/ActivityLog'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // NEW: Add location data to credentials
        locationData: { label: 'Location', type: 'text' }
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const userAgent = req.headers?.['user-agent'] || ''
          const deviceInfo = getDeviceInfo(userAgent)
          
          // Parse location data if provided
          let locationData = null
          if (credentials.locationData) {
            try {
              locationData = JSON.parse(credentials.locationData)
            } catch (error) {
              console.log('Failed to parse location data:', error)
            }
          }
          
          if (!deviceInfo.isAllowed) {
            // Log blocked device attempt with location
            await logActivity({
              userId: null,
              userName: null,
              userEmail: credentials.email,
              userRole: null,
              action: 'login_blocked',
              category: 'authentication',
              details: {
                reason: 'device_blocked',
                deviceType: deviceInfo.deviceType,
                email: credentials.email,
                location: locationData // NEW: Include location
              },
              request: req,
              locationData: locationData // NEW: Store location data
            })
            
            throw new Error(`DEVICE_BLOCKED:${deviceInfo.deviceType}`)
          }

          const user = await User.findByEmail(credentials.email)
          
          if (!user) {
            // Log failed login - user not found with location
            await logActivity({
              userId: null,
              userName: null,
              userEmail: credentials.email,
              userRole: null,
              action: 'login_failed',
              category: 'authentication',
              details: {
                reason: 'user_not_found',
                email: credentials.email,
                location: locationData // NEW: Include location
              },
              request: req,
              locationData: locationData // NEW: Store location data
            })
            
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            // Log failed login - invalid password with location
            await logActivity({
              userId: user._id.toString(),
              userName: user.fullName,
              userEmail: user.email,
              userRole: user.role,
              action: 'login_failed',
              category: 'authentication',
              details: {
                reason: 'invalid_password',
                email: credentials.email,
                location: locationData // NEW: Include location
              },
              request: req,
              locationData: locationData // NEW: Store location data
            })
            
            return null
          }

          // Log successful login with location
          await logActivity({
            userId: user._id.toString(),
            userName: user.fullName,
            userEmail: user.email,
            userRole: user.role,
            action: 'login',
            category: 'authentication',
            details: {
              deviceType: deviceInfo.deviceType,
              loginTime: new Date().toISOString(),
              location: locationData // NEW: Include location
            },
            request: req,
            locationData: locationData // NEW: Store location data
          })
          
          await User.updateLastLogin(user._id.toString())
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            role: user.role,
            deviceType: deviceInfo.deviceType
          }
        } catch (error) {
          if (error.message.startsWith('DEVICE_BLOCKED:')) {
            throw error
          }
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
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
    }
  },
  events: {
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: true,
}