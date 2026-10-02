const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { seedDatabase } = require('./seed/seedRecipes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS setup
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'client')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/recipes', require('./routes/recipeRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RecipeShare API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Fallback for client HTML routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Start Server and connect database
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`
========================================================
   🍴 RECIPESHARE SERVER RUNNING 🍴
   "Discover. Cook. Share."
========================================================
   Local Server: http://localhost:${PORT}
   API Health:   http://localhost:${PORT}/api/health
   Client App:   http://localhost:${PORT}/index.html
========================================================
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
