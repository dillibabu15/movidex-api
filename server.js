require('dotenv').config(); // Load .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const userRoutes = require('./routes/userRoutes'); // Route file
const moviesRoutes = require('./routes/moviesRoutes'); // Route file


const app = express();

// Middlewares
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// API route
app.use('/api/users', userRoutes); // User routes
app.use('/api/movies', moviesRoutes); // Movie routes

// // Optional root route (prevents "Cannot GET /")
// app.get('/', (req, res) => {
//   res.send('MoviePlux API is working!');
// });


// // Optional root route (prevents "Cannot GET /")
// app.get('/login', (req, res) => {
//   res.send('Login API is working!');
// });

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ MongoDB connected");
    
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

  