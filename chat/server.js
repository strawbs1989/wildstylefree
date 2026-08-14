const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Setup DOMPurify for HTML sanitization (XSS Defense)
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const JWT_SECRET = "your-super-secret-key-change-this";

// In-memory Rate Limiter for Socket messages (e.g., max 5 msgs per 3 seconds)
const messageCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 3000;
const MAX_MESSAGES_PER_WINDOW = 5;

// Socket Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: Token required"));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // Attach user info (username, userId) to socket
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);

  socket.on('chat_message', (data) => {
    const userId = socket.user.userId;
    const now = Date.now();

    // --- 1. WebSocket Rate Limiting Check ---
    let userActivity = messageCounts.get(userId) || { count: 0, startTime: now };

    if (now - userActivity.startTime > RATE_LIMIT_WINDOW_MS) {
      // Reset window
      userActivity = { count: 1, startTime: now };
    } else {
      userActivity.count += 1;
    }

    messageCounts.set(userId, userActivity);

    if (userActivity.count > MAX_MESSAGES_PER_WINDOW) {
      socket.emit('error_message', 'Slow down! You are sending messages too fast.');
      return;
    }

    // --- 2. Input Sanitization (XSS Prevention) ---
    // Allow basic formatting tags for wildstyle/MSN vibe, strip dangerous scripts/attributes
    const cleanHTML = DOMPurify.sanitize(data.htmlMessage, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'span', 'font', 'marquee'],
      ALLOWED_ATTR: ['style', 'color', 'size', 'face']
    });

    if (!cleanHTML || cleanHTML.trim() === '') return;

    // --- 3. Broadcast Safe Message ---
    io.emit('chat_message', {
      user: socket.user.username,
      htmlMessage: cleanHTML,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    messageCounts.delete(socket.user.userId);
  });
});

server.listen(3000, () => {
  console.log('MSN Wildstyle Secure Chat Server running on port 3000');
});
