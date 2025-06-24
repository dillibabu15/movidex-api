const express = require('express');
const router = express.Router();
const Movie = require('../models/Movies');

// GET /api/movies
router.get('/', async (req, res) => {
  try {
    // Example: filter by genre if provided as a query param
    const filter = {};
    if (req.query.genre) {
      filter.genre = req.query.genre;
    }
    // Example: search by title if provided as a query param
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }
    // Example: pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0; // 0 means no limit
    const skip = (page - 1) * limit;

    const movies = await Movie.find(filter).skip(skip).limit(limit);
    
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;