const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  id: Number,
  title: String,
  image: String,
  genre: String,
  rating: Number
}, { collection: 'moives' });

module.exports = mongoose.model('Movies', MovieSchema);