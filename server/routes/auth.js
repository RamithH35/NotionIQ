import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';

const router = express.Router();

// POST /api/register
router.post('/register', authRateLimiter(), validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Account Exists', message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    await user.save();

    // Start session
    req.session.userId = user._id.toString();

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[Auth Error] Registration error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'An unexpected error occurred during registration. Please try again.' });
  }
});

// POST /api/login
router.post('/login', authRateLimiter(), validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Authentication Error', message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Authentication Error', message: 'Invalid email or password.' });
    }

    // Start session
    req.session.userId = user._id.toString();

    return res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('[Auth Error] Login error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'An unexpected error occurred during login. Please try again.' });
  }
});

// POST /api/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/me
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ user: null });
  }

  try {
    const user = await User.findById(req.session.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ user: null });
    }
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
