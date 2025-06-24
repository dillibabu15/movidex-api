const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }
}, { collection: 'user' }); // important: this MUST match your MongoDB collection name

module.exports = mongoose.model('User', UserSchema);
