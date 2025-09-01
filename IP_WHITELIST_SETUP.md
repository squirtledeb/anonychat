# IP Whitelist Setup for College WiFi Restriction

This guide explains how to configure the IP whitelist to restrict access to only your college's WiFi network.

## 🎯 **What This Does**

- **Restricts access** to only users connected to your college WiFi
- **Shows restriction page** for users from other networks
- **Logs all access attempts** for security monitoring
- **Works with both IPv4 and IPv6** addresses

## 📍 **How to Find Your College WiFi IPs**

### **Method 1: Check Your Device**
1. **Connect to your college WiFi**
2. **Check your IP address:**
   - **Windows:** `ipconfig` in Command Prompt
   - **Mac/Linux:** `ifconfig` or `ip addr` in Terminal
   - **Mobile:** Settings → WiFi → Network Details

### **Method 2: Ask IT Department**
- Contact your college's IT department
- Ask for the WiFi network's IP range/subnet
- They usually provide this information

### **Method 3: Network Scanner**
- Use tools like `nmap` to scan your network
- Find the IP range your college uses

## ⚙️ **Configuration Steps**

### **1. Edit the Whitelist File**
Open `backend/whitelist.js` and update the `WHITELISTED_IPS` array:

```javascript
const WHITELISTED_IPS = [
  // Replace with your actual college WiFi IPs
  '192.168.100.0/24',     // Example: Your college WiFi subnet
  '10.10.50.0/24',        // Example: Another college network
  '172.20.0.0/16',        // Example: College admin network
  
  // For testing on localhost (remove in production)
  '127.0.0.1',
  '::1',
  'localhost'
];
```

### **2. IP Address Formats Supported**

#### **Single IP:**
```javascript
'192.168.1.100'           // Specific IP address
```

#### **IP Range (CIDR):**
```javascript
'192.168.1.0/24'          // 192.168.1.0 to 192.168.1.255
'10.0.0.0/8'              // 10.0.0.0 to 10.255.255.255
'172.16.0.0/12'           // 172.16.0.0 to 172.31.255.255
```

#### **Localhost (for testing):**
```javascript
'127.0.0.1',              // IPv4 localhost
'::1',                     // IPv6 localhost
'localhost'                // Hostname localhost
```

## 🔍 **Testing Your Configuration**

### **1. Test from College WiFi:**
- Connect to your college WiFi
- Visit the app - should work normally

### **2. Test from Other Networks:**
- Connect to mobile data or home WiFi
- Visit the app - should show restriction page

### **3. Check Server Logs:**
The backend logs all access attempts:
```
Client IP: 192.168.1.100
Access granted for IP: 192.168.1.100

Client IP: 203.0.113.45
Access denied for IP: 203.0.113.45
```

## 🚨 **Security Considerations**

### **Remove Localhost in Production:**
```javascript
// Remove these lines before deploying to production
'127.0.0.1',
'::1',
'localhost'
```

### **Monitor Access Logs:**
- Check server logs regularly
- Look for unauthorized access attempts
- Consider adding rate limiting

### **Update Whitelist Regularly:**
- College networks may change IP ranges
- Update when IT department makes changes
- Test after any network updates

## 🛠️ **Troubleshooting**

### **App Shows Restriction Page on College WiFi:**
1. **Check your IP address** - make sure it's in the whitelist
2. **Verify CIDR notation** - ensure the range includes your IP
3. **Check server logs** - see what IP is being detected

### **App Works from Outside College WiFi:**
1. **Verify whitelist is loaded** - check server startup logs
2. **Restart the server** - after making whitelist changes
3. **Check IP detection** - ensure the correct IP is being captured

### **Common IP Ranges:**
```javascript
// Common college WiFi ranges (examples)
'192.168.0.0/16',         // 192.168.x.x
'10.0.0.0/8',             // 10.x.x.x
'172.16.0.0/12',          // 172.16-31.x.x
'169.254.0.0/16',         // Link-local addresses
```

## 📱 **Mobile Device Considerations**

- **Mobile devices** may use different IP ranges
- **Some colleges** have separate networks for mobile
- **Test with actual devices** students will use

## 🔄 **Updating the Whitelist**

After making changes to `backend/whitelist.js`:

1. **Save the file**
2. **Restart the backend server**
3. **Test from different networks**
4. **Check server logs** for proper IP detection

## 📞 **Need Help?**

If you're having trouble:
1. **Check the server logs** for IP detection issues
2. **Verify your college's network configuration**
3. **Test with simple IP ranges first**
4. **Contact your IT department** for network details

---

**Remember:** This system only works when users are physically connected to your college's WiFi network. Users on VPNs or other networks will be blocked.
