// College WiFi IP Whitelist
// Only this specific IP address is allowed

const WHITELISTED_IPS = [
  // Only allow this specific IP address
  '117.232.140.181',
  '182.79.16.62',
  
  // For testing on localhost (remove in production)
  '127.0.0.1',
  '::1',
  'localhost'
];

// IP validation function
function isIPWhitelisted(clientIP) {
  // Handle IPv6 localhost
  if (clientIP === '::1' || clientIP === 'localhost') {
    return true;
  }
  
  // Handle IPv4 localhost
  if (clientIP === '127.0.0.1') {
    return true;
  }
  
  // Check if IP is in whitelisted ranges
  for (const whitelistedIP of WHITELISTED_IPS) {
    if (whitelistedIP.includes('/')) {
      // CIDR notation (e.g., 192.168.1.0/24)
      if (isIPInRange(clientIP, whitelistedIP)) {
        return true;
      }
    } else {
      // Single IP
      if (clientIP === whitelistedIP) {
        return true;
      }
    }
  }
  
  return false;
}

// Helper function to check if IP is in CIDR range
function isIPInRange(ip, cidr) {
  const [range, bits = '32'] = cidr.split('/');
  const mask = ~((2 ** (32 - parseInt(bits))) - 1);
  const ipLong = ipToLong(ip);
  const rangeLong = ipToLong(range);
  
  return (ipLong & mask) === (rangeLong & mask);
}

// Convert IP to long integer
function ipToLong(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

module.exports = {
  WHITELISTED_IPS,
  isIPWhitelisted
};
