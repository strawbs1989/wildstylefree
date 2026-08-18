const express = require('express');
const http = require('http');
const path = require('path');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// 1. Setup Express App
const app = express();
app.use(express.json());

// Serve static HTML/CSS files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// DOMPurify setup for XSS prevention
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const JWT_SECRET = "your-super-secret-key-change-this";
// Testing key provided by Cloudflare (Passes automatically)
const TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA"; 

// --- API Route: Verify Bot via Cloudflare Turnstile ---
app.post('/api/join-chat', async (req, res) => {
  const { username, turnstileToken } = req.body;

  if (!username || !turnstileToken) {
    return res.status(400).json({ error: 'Username and bot verification token required.' });
  }

  try {
    // Contact Cloudflare to verify human status
    const cfResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: req.ip
      })
    });

    const cfData = await cfResponse.json();

    if (!cfData.success) {
      return res.status(403).json({ error: 'Bot verification failed.' });
    }

    // Success! Issue a signed JWT token
    const token = jwt.sign(
      { userId: `user_${Date.now()}`, username },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ error: 'Verification server error.' });
  }
});

// --- Socket.IO Real-time Chat setup ---
const server = http.createServer(app);
const io = new Server(server);

// Authenticate socket connections with JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: Token required"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username}`);

  socket.on('chat_message', (data) => {
    // Clean user formatting with DOMPurify before broadcasting
    const cleanHTML = DOMPurify.sanitize(data.htmlMessage, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'span', 'font'],
      ALLOWED_ATTR: ['style', 'color', 'size', 'face']
    });

    if (!cleanHTML || cleanHTML.trim() === '') return;

    io.emit('chat_message', {
      user: socket.user.username,
      htmlMessage: cleanHTML,
      timestamp: new Date().toLocaleTimeString()
    });
  });
});

server.listen(3000, () => console.log('MSN Chat running at http://localhost:3000'));
