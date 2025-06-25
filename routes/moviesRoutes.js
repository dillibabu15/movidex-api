const express = require('express');
const router = express.Router();
const Movie = require('../models/Movies');
const auth = require('../middleware/auth'); // <-- Add this

// GET /api/movies (protected)
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.genre) filter.genre = req.query.genre;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0;
    const skip = (page - 1) * limit;

    const movies = await Movie.find(filter).skip(skip).limit(limit);
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;