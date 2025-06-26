const mongoose = require('mongoose'); // <-- Add this line

const MovieSchema = new mongoose.Schema({
  id: Number,
  title: String,
  image: String,
  genre: String,
  rating: Number
}, { collection: 'movieslist' });

module.exports = mongoose.model('Movies', MovieSchema);