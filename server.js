require('dotenv').config(); // Load .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const userRoutes = require('./routes/userRoutes');
const moviesRoutes = require('./routes/moviesRoutes');

const app = express();

// Security headers (X-Frame-Options, CSP, HSTS, etc.)
app.use(helmet());

// CORS - configurable via env
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parser with size limit (prevents DoS via large payloads)
app.use(express.json({ limit: '10kb' }));

// Root route (before API routes)
app.get('/', (req, res) => {
  res.send('Moviedux API is running!');
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/movies', moviesRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Connect to MongoDB then start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

  