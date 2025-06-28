const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  date: { type: Date, default: Date.now }
});

const RatingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  value: { type: Number, min: 1, max: 5 }
});

const MovieSchema = new mongoose.Schema({
  id: Number,
  title: String,
  image: String,
  genre: String,
  rating: Number,
  description: String,
  reviews: [ReviewSchema],
  ratings: [RatingSchema]
}, { collection: 'movieslist' });

module.exports = mongoose.model('Movies', MovieSchema);
