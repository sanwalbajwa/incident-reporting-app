'use client'
import { signOut } from 'next-auth/react'
import { LocationService } from '@/lib/locationService'

export function useLogoutWithLocation() {
  const logoutWithLocation = async () => {
    try {
      console.log('Starting logout with location tracking...')
      
      // Get current location before signing out
      const locationData = await LocationService.getCurrentLocation()
      
      console.log('Location obtained for logout:', {
        hasLocationData: !!locationData,
        source: locationData?.source,
        error: locationData?.error
      })

      // Send logout event with location to our API
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ locationData })
        })
        console.log('Logout location logged successfully')
      } catch (logError) {
        console.error('Failed to log logout location:', logError)
        // Continue with logout even if location logging fails
      }

      // Perform the actual sign out
      await signOut()
      
    } catch (error) {
      console.error('Error during logout with location:', error)
      // Fallback to regular signout if location fails
      await signOut()
    }
  }

  return { logoutWithLocation }
}