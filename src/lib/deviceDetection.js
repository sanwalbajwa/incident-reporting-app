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

export function isAllowedDevice(userAgent) {
  const deviceType = getDeviceType(userAgent);
  
  // Allow tablets and desktops, block mobile phones
  return deviceType === 'tablet' || deviceType === 'desktop';
}

// Enhanced device info for logging/debugging
export function getDeviceInfo(userAgent) {
  const deviceType = getDeviceType(userAgent);
  
  return {
    deviceType,
    isAllowed: isAllowedDevice(userAgent),
    userAgent: userAgent,
    timestamp: new Date().toISOString()
  };
}