const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { isIPWhitelisted } = require('./whitelist');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true, // Allow all origins for Render deployment
    methods: ["GET", "POST"]
  }
});

// IP restriction middleware
const checkIPAccess = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket?.remoteAddress;
  
  // Clean up IP address (remove IPv6 prefix if present)
  const cleanIP = clientIP.replace(/^::ffff:/, '');
  
  console.log(`Client IP: ${cleanIP}`);
  
  if (!isIPWhitelisted(cleanIP)) {
    console.log(`Access denied for IP: ${cleanIP}`);
    return res.status(403).json({
      error: 'Access Denied',
      message: 'This application is only available from authorized college WiFi networks.',
      clientIP: cleanIP
    });
  }
  
  console.log(`Access granted for IP: ${cleanIP}`);
  next();
};

// Middleware
app.use(cors({
  origin: true, // Allow all origins for Render deployment
  credentials: true
}));
app.use(express.json());

// Apply IP restriction to all routes
app.use(checkIPAccess);

// Data structures for managing chat sessions
const waitingQueue = [];           // Array of userIds waiting to be paired
const activePairs = {};            // Map: userId -> partnerId
const sockets = {};                // Map: userId -> socket instance

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  // Handle user joining with their userId
  socket.on('join', ({ userId }) => {
    console.log('User joining:', userId);
    
    // Store socket reference
    sockets[userId] = socket;
    
    // Check if there's someone waiting in the queue
    if (waitingQueue.length > 0) {
      // Pair with someone from the queue
      const partnerId = waitingQueue.shift();
      const partnerSocket = sockets[partnerId];
      
      if (partnerSocket) {
        // Create the pairing
        activePairs[userId] = partnerId;
        activePairs[partnerId] = userId;
        
        // Notify both users they're paired
        socket.emit('paired', { partnerId });
        partnerSocket.emit('paired', { partnerId: userId });
        
        console.log(`Users ${userId} and ${partnerId} are now paired`);
      } else {
        // Partner socket not found, add current user to queue
        waitingQueue.push(userId);
        socket.emit('waiting');
      }
    } else {
      // No one waiting, add to queue
      waitingQueue.push(userId);
      socket.emit('waiting');
      console.log(`User ${userId} added to waiting queue`);
    }
  });
  
  // Handle incoming messages
  socket.on('message', ({ text, userId }) => {
    const partnerId = activePairs[userId];
    
    if (partnerId && sockets[partnerId]) {
      // Forward message to partner
      sockets[partnerId].emit('message', { text, from: userId });
      console.log(`Message from ${userId} forwarded to ${partnerId}`);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find userId for this socket
    let disconnectedUserId = null;
    for (const [userId, sock] of Object.entries(sockets)) {
      if (sock === socket) {
        disconnectedUserId = userId;
        break;
      }
    }
    
    if (disconnectedUserId) {
      // Remove from waiting queue if present
      const queueIndex = waitingQueue.indexOf(disconnectedUserId);
      if (queueIndex > -1) {
        waitingQueue.splice(queueIndex, 1);
        console.log(`User ${disconnectedUserId} removed from waiting queue`);
      }
      
      // Handle if user was paired
      const partnerId = activePairs[disconnectedUserId];
      if (partnerId) {
        // Notify partner that stranger left
        if (sockets[partnerId]) {
          sockets[partnerId].emit('stranger_left');
        }
        
        // Clean up pairing
        delete activePairs[disconnectedUserId];
        delete activePairs[partnerId];
        
        console.log(`Pairing broken: ${disconnectedUserId} and ${partnerId}`);
      }
      
      // Clean up socket reference
      delete sockets[disconnectedUserId];
    }
  });
});

// API routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    waiting: waitingQueue.length, 
    activePairs: Object.keys(activePairs).length / 2 
  });
});

// Catch-all route: serve the React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Waiting queue: ${waitingQueue.length}`);
  console.log(`Active pairs: ${Object.keys(activePairs).length / 2}`);
});
