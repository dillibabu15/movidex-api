const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth'); // JWT verification middleware

// POST /api/users/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!password || password.length < 12) {
      return res.status(400).json({ message: 'Password must be at least 12 characters' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role: 'user' // default role
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Include role in the token payload
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      },
      token,
      message: 'Login success'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/:id/watchlist - Get user's watchlist
router.get('/:id/watchlist', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.findById(req.user.id).populate('watchlist');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ watchlist: user.watchlist });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/:id/watchlist - Update user's watchlist
router.post('/:id/watchlist', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { watchlist } = req.body;
    if (!Array.isArray(watchlist)) {
      return res.status(400).json({ message: 'Watchlist must be an array of movie IDs' });
    }

    await User.findByIdAndUpdate(req.user.id, { watchlist });
    res.json({ message: 'Watchlist updated successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
