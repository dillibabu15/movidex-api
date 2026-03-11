const express = require('express');
const router = express.Router();
const Movie = require('../models/Movies');
const auth = require('../middleware/auth');

// GET /api/movies (protected, with optional filters)
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.genre && typeof req.query.genre === 'string') {
      filter.genre = req.query.genre;
    }
    if (req.query.search && typeof req.query.search === 'string') {
      // Escape regex special chars to prevent ReDoS
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: escaped, $options: 'i' };
    }
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

// GET /api/movies/:id - Get single movie by ID (with reviews/ratings)
router.get('/:id', auth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('reviews.user', 'username');
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    console.error('Movie fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/movies/:id/review - Add review and rating (protected)
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { text, rating } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ message: 'Review text is required' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    // Prevent duplicate reviews by the same user
    const alreadyReviewed = movie.reviews.some(
      r => r.user.toString() === req.user.id
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this movie.' });
    }

    // Add review (sanitize text)
    movie.reviews.push({ user: req.user.id, text: text.trim(), date: new Date() });
    // Add rating
    movie.ratings.push({ user: req.user.id, value: rating });

    await movie.save();
    res.json({ message: 'Review added successfully' });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Admin: Add a new movie
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { title, genre, rating, image, description } = req.body;
    if (!title || !genre || !rating || !image || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const movie = new Movie({ title, genre, rating, image, description });
    await movie.save();
    res.status(201).json({ message: 'Movie added', movie });
  } catch (err) {
    console.error('Add movie error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Edit a movie
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { title, genre, rating, image, description } = req.body;
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { title, genre, rating, image, description },
      { new: true }
    );
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json({ message: 'Movie updated', movie });
  } catch (err) {
    console.error('Update movie error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Delete a movie
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    console.error('Delete movie error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;