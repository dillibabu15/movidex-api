const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const sanitize = require('mongo-sanitize');
const User = require('../models/User');
const auth = require('../middleware/auth'); // JWT verification middleware

// Rate limiter for auth endpoints (10 attempts per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password complexity check
const isStrongPassword = (password) => {
  if (typeof password !== 'string' || password.length < 12) return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(password);
};

// POST /api/users/register
router.post('/register', authLimiter, async (req, res) => {
  const username = sanitize(req.body.username);
  const password = req.body.password;

  // Validate types
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input' });
  }

  // Username validation
  if (!username || username.trim().length < 3 || username.trim().length > 30) {
    return res.status(400).json({ message: 'Username must be 3-30 characters' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ message: 'Username may only contain letters, numbers, and underscores' });
  }

  try {
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character (@$!%*?&#)'
      });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username: username.trim(),
      password: hashedPassword,
      role: 'user' // default role
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered' });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/users/login
router.post('/login', authLimiter, async (req, res) => {
  const username = sanitize(req.body.username);
  const password = req.body.password;

  // Validate types
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Include role in the token payload
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
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
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users - Get all users (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const users = await User.find({}, "_id username role");
    res.json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { username, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, role },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ _id: user._id, username: user.username, role: user.role });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Internal server error' });
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
    console.error('Watchlist fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/users/:id/watchlist - Update user's watchlist
router.post('/:id/watchlist', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { watchlist } = req.body;
    if (!Array.isArray(watchlist) || !watchlist.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'Watchlist must be an array of valid movie IDs' });
    }

    await User.findByIdAndUpdate(req.user.id, { watchlist });
    res.json({ message: 'Watchlist updated successfully' });

  } catch (err) {
    console.error('Watchlist update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/details - Admin: Get all users with watchlist, reviews, and ratings
router.get("/details", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const users = await User.find({}, "_id username role watchlist")
    .populate("watchlist", "title")
    .lean();

  // Get all movies with reviews/ratings
  const Movie = require("../models/Movies");
  const movies = await Movie.find({}, "title reviews ratings").lean();

  // Map userId to their reviews/ratings
  const userDetails = users.map(user => {
    // Reviews by this user
    const userReviews = [];
    const userRatings = [];
    movies.forEach(movie => {
      // Reviews
      (movie.reviews || []).forEach(r => {
        if (r.user && r.user.toString() === user._id.toString()) {
          userReviews.push({
            movieTitle: movie.title,
            text: r.text,
            date: r.date
          });
        }
      });
      // Ratings
      (movie.ratings || []).forEach(r => {
        if (r.user && r.user.toString() === user._id.toString()) {
          userRatings.push({
            movieTitle: movie.title,
            value: r.value
          });
        }
      });
    });
    return {
      _id: user._id,
      username: user.username,
      role: user.role,
      watchlist: user.watchlist || [],
      reviews: userReviews,
      ratings: userRatings
    };
  });

  res.json(userDetails);
});

module.exports = router;
