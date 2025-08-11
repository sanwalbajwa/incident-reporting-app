// src/lib/locationService.js - Complete location tracking service

export class LocationService {
  static async getCurrentLocation() {
    const locationData = {
      timestamp: new Date().toISOString(),
      source: null,
      latitude: null,
      longitude: null,
      accuracy: null,
      address: null,
      city: null,
      country: null,
      error: null
    }

    try {
      // Try browser geolocation first
      const browserLocation = await this.getBrowserLocation()
      if (browserLocation.success) {
        Object.assign(locationData, browserLocation.data)
        locationData.source = 'gps'
        
        // Try to get address from coordinates
        try {
          const address = await this.reverseGeocode(
            browserLocation.data.latitude, 
            browserLocation.data.longitude
          )
          Object.assign(locationData, address)
        } catch (reverseGeoError) {
          console.log('Reverse geocoding failed:', reverseGeoError.message)
        }
        
        return locationData
      }
    } catch (gpsError) {
      console.log('GPS location failed:', gpsError.message)
    }

    // Fallback to IP-based location
    try {
      const ipLocation = await this.getIPLocation()
      if (ipLocation.success) {
        Object.assign(locationData, ipLocation.data)
        locationData.source = 'ip'
        return locationData
      }
    } catch (ipError) {
      console.log('IP location failed:', ipError.message)
      locationData.error = 'All location methods failed'
    }

    return locationData
  }

  static getBrowserLocation(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      const options = {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 300000 // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            data: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toISOString()
            }
          })
        },
        (error) => {
          let errorMessage = 'Unknown error'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          reject(new Error(errorMessage))
        },
        options
      )
    })
  }

  static async getIPLocation() {
    try {
      // Using a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 5000
      })
      
      if (!response.ok) {
        throw new Error('IP location service unavailable')
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.reason || 'IP location failed')
      }
      
      return {
        success: true,
        data: {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: 10000, // IP-based is less accurate
          city: data.city,
          region: data.region,
          country: data.country_name,
          postal: data.postal,
          timezone: data.timezone,
          address: `${data.city}, ${data.region}, ${data.country_name}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static async reverseGeocode(latitude, longitude) {
    try {
      // Using OpenStreetMap Nominatim (free reverse geocoding)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'IRPA-Security-App/1.0'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }
      
      const data = await response.json()
      
      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        country: data.address?.country,
        postal: data.address?.postcode,
        street: data.address?.road,
        building: data.address?.building
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return {
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: null,
        country: null
      }
    }
  }

  // Format location for display
  static formatLocationForDisplay(locationData) {
    if (!locationData) return 'Location unavailable'
    
    if (locationData.error) {
      return `Location error: ${locationData.error}`
    }
    
    if (locationData.address) {
      return locationData.address
    }
    
    if (locationData.latitude && locationData.longitude) {
      const accuracy = locationData.accuracy 
        ? ` (±${Math.round(locationData.accuracy)}m)` 
        : ''
      return `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}${accuracy}`
    }
    
    return 'Location unavailable'
  }

  // Get location accuracy description
  static getAccuracyDescription(accuracy) {
    if (!accuracy) return 'Unknown'
    
    if (accuracy < 10) return 'Very High (GPS)'
    if (accuracy < 100) return 'High (GPS)'
    if (accuracy < 1000) return 'Medium (Network)'
    if (accuracy < 10000) return 'Low (Cell Tower)'
    return 'Very Low (IP-based)'
  }

  // Check if user is within a specific area (geofencing)
  static isWithinArea(userLocation, areaCenter, radiusMeters) {
    if (!userLocation.latitude || !userLocation.longitude) return false
    
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      areaCenter.latitude,
      areaCenter.longitude
    )
    
    return distance <= radiusMeters
  }

  // Calculate distance between two points (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }
}