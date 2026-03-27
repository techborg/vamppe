const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const { apiLimiter, mongoSanitize, xssSanitizer, hpp } = require('./middleware/security');
const PageView = require('./models/PageView');
const Message = require('./models/Message');

dotenv.config();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://10.0.2.2:5173',
  'http://localhost:19006',
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
];

const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST'], credentials: true },
});

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads images
  contentSecurityPolicy: false, // handled by frontend
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Sanitization ──────────────────────────────────────────────────────────────
app.use(mongoSanitize());   // strip $ and . from req.body/query/params
app.use(xssSanitizer);      // escape HTML in all string fields
app.use(hpp());             // prevent HTTP parameter pollution

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Visitor tracking ──────────────────────────────────────────────────────────
const SKIP_PATHS = ['/api/admin', '/uploads', '/api/auth/me'];
const detectDevice = (ua = '') => {
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
};

// In-memory geo cache: rawIp → { country, countryCode, city, lat, lon }
const geoCache = new Map();

async function lookupGeo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
    return { country: 'Local', countryCode: 'XX', city: '', lat: null, lon: null };
  }
  if (geoCache.has(ip)) return geoCache.get(ip);
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city,lat,lon,status`);
    const data = await res.json();
    const geo = data.status === 'success'
      ? { country: data.country, countryCode: data.countryCode, city: data.city, lat: data.lat, lon: data.lon }
      : { country: '', countryCode: '', city: '', lat: null, lon: null };
    geoCache.set(ip, geo);
    // Evict cache after 1000 entries
    if (geoCache.size > 1000) geoCache.delete(geoCache.keys().next().value);
    return geo;
  } catch {
    return { country: '', countryCode: '', city: '', lat: null, lon: null };
  }
}

app.use((req, res, next) => {
  // Only track GET requests to /api routes, skip admin/auth/uploads
  if (req.method === 'GET' && req.path.startsWith('/api/') &&
      !SKIP_PATHS.some((p) => req.path.startsWith(p))) {
    const rawIp = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const ip = crypto.createHash('sha256').update(rawIp).digest('hex').slice(0, 16);
    const ua = req.headers['user-agent'] || '';
    lookupGeo(rawIp).then((geo) => {
      PageView.create({ path: req.path, ip, userAgent: ua, device: detectDevice(ua), ...geo }).catch(() => {});
    });
  }
  next();
});

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/stories',       require('./routes/stories'));
app.use('/api/bookmarks',     require('./routes/bookmarks'));

// ─── Socket.io ────────────────────────────────────────────────────────────────
// userId → socketId map for targeted delivery
const onlineUsers = new Map();

const getSocketId = (userId) => userId ? onlineUsers.get(userId.toString()) : null;

io.on('connection', (socket) => {

  socket.on('user_connected', (userId) => {
    if (!userId) return;
    onlineUsers.set(userId.toString(), socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  // Typing indicators
  socket.on('typing_start', ({ senderId, receiverId }) => {
    const sid = getSocketId(receiverId);
    if (sid) io.to(sid).emit('typing_start', { senderId });
  });

  socket.on('typing_stop', ({ senderId, receiverId }) => {
    const sid = getSocketId(receiverId);
    if (sid) io.to(sid).emit('typing_stop', { senderId });
  });

  socket.on('message_reaction', ({ messageId, reaction, receiverId }) => {
    const sid = getSocketId(receiverId);
    if (sid) io.to(sid).emit('message_reaction', { messageId, reaction });
  });

  socket.on('mark_as_read', async ({ senderId, receiverId }) => {
    if (!senderId || !receiverId) return;
    try {
      await Message.updateMany(
        { senderId, receiverId, read: false },
        { read: true, readAt: new Date() }
      );
      const sid = getSocketId(senderId);
      if (sid) io.to(sid).emit('messages_read', { by: receiverId });
    } catch (err) {
      console.error('mark_as_read error:', err);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
});

// Expose helpers to routes
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// ─── DB + Start ───────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vamppe')
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('DB connection error:', err));
