const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authLimiter } = require('../middleware/security');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    if (username.length < 3 || username.length > 30)
      return res.status(400).json({ message: 'Username must be 3–30 characters' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passRegex.test(password))
      return res.status(400).json({ message: 'Password must include uppercase, lowercase, and a number' });
    
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: hashed });

    const token = signToken(user._id);
    const { password: _, ...userData } = user.toObject();
    res.status(201).json({ token, user: userData });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} already taken` });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.banned) return res.status(403).json({ message: 'Your account has been suspended.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    const { password: _, ...userData } = user.toObject();
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
