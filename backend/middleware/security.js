const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss');

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Strict limiter for auth endpoints (login / register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { message: 'Too many attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  message: { message: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload limiter (post creation with images)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many uploads, please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── XSS sanitizer middleware ──────────────────────────────────────────────────
// Recursively sanitize all string values in req.body
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}

const xssSanitizer = (req, _res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  next();
};

// ── Banned user guard ─────────────────────────────────────────────────────────
const User = require('../models/User');

const checkBanned = async (req, res, next) => {
  if (!req.userId) return next();
  try {
    const user = await User.findById(req.userId).select('banned');
    if (user?.banned) return res.status(403).json({ message: 'Your account has been suspended.' });
    next();
  } catch {
    next();
  }
};

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  mongoSanitize,
  xssSanitizer,
  hpp,
  checkBanned,
};
