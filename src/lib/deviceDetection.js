// src/lib/deviceDetection.js - Updated to allow management mobile access

export function isMobileDevice(userAgent) {
  if (!userAgent) return false;
  
  const mobileRegex = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
  return mobileRegex.test(userAgent);
}

export function isTabletDevice(userAgent) {
  if (!userAgent) return false;
  
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Kindle|Silk/i;
  return tabletRegex.test(userAgent);
}

export function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  if (isMobileDevice(userAgent)) {
    return 'mobile';
  }
  
  if (isTabletDevice(userAgent)) {
    return 'tablet';
  }
  
  // Desktop/laptop browsers
  return 'desktop';
}

// NEW: Updated to include role-based exceptions
export function isAllowedDevice(userAgent, userRole = null) {
  const deviceType = getDeviceType(userAgent);
  
  // Management users can access from any device (including mobile)
  if (userRole === 'management') {
    console.log('Management user detected - allowing all devices');
    return true;
  }
  
  // For all other roles: Allow tablets and desktops, block mobile phones
  return deviceType === 'tablet' || deviceType === 'desktop';
}

// Enhanced device info for logging/debugging - NEW: includes role context
export function getDeviceInfo(userAgent, userRole = null) {
  const deviceType = getDeviceType(userAgent);
  
  return {
    deviceType,
    isAllowed: isAllowedDevice(userAgent, userRole),
    userRole: userRole,
    isManagementException: userRole === 'management' && deviceType === 'mobile',
    userAgent: userAgent,
    timestamp: new Date().toISOString()
  };
}