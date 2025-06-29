const express = require('express');
const router = express.Router();
const Movie = require('../models/Movies');
const auth = require('../middleware/auth');

// GET /api/movies (protected, with optional filters)
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

// GET /api/movies/:id - Get single movie by ID (with reviews/ratings)
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('reviews.user', 'username');
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/movies/:id/review - Add review and rating (protected)
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { text, rating } = req.body;
    if (!text || !rating) {
      return res.status(400).json({ message: 'Text and rating required' });
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

    // Add review
    movie.reviews.push({ user: req.user.id, text, date: new Date() });
    // Add rating
    movie.ratings.push({ user: req.user.id, value: rating });

    await movie.save();
    res.json({ message: 'Review added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
    res.status(500).json({ message: 'Server error', error: err.message });
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
    res.status(500).json({ message: 'Server error', error: err.message });
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;