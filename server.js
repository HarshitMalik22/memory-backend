const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const HighScore = require('./models/HighScore'); // High score model import
const cors = require('cors'); // Import CORS
const app = express();

// CORS Middleware (Apply globally)
const allowedOrigins = [
  'https://memory-frontend-delta.vercel.app', // Production frontend URL
  'http://localhost:3000', // Localhost for development
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], // Add x-auth-token here
  credentials: true, // Allow cookies and authorization headers
};

// Apply CORS globally before routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Connect DB with error handling
connectDB();

// Initialize middleware for JSON parsing
app.use(express.json());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/history', require('./routes/history'));

// High Score Route
app.post('/api/highscore', async (req, res) => {
  try {
    const { username, moves, level } = req.body;

    if (!username || !moves || !level) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (
      typeof username !== 'string' ||
      typeof moves !== 'number' ||
      typeof level !== 'string' ||
      moves <= 0
    ) {
      return res
        .status(400)
        .json({ message: 'Invalid data types or moves must be positive' });
    }

    const existingHighScore = await HighScore.findOne({ level }).sort({ moves: 1 });

    if (!existingHighScore || moves < existingHighScore.moves) {
      const newHighScore = new HighScore({ username, moves, level });
      await newHighScore.save();
      return res
        .status(201)
        .json({ message: 'New high score submitted successfully' });
    }

    res.status(200).json({
      message: 'High score not updated because an existing high score is lower',
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error submitting high score', error: error.message });
  }
});

app.get('/api/highscore/:level', async (req, res) => {
  const { level } = req.params;
  try {
    const highScores = await HighScore.find({ level }).sort({ moves: 1 }).limit(1);
    if (highScores.length > 0) {
      return res.json(highScores[0]);
    }
    res.status(404).json({ message: 'No high score found for this level' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error retrieving high scores', error: error.message });
  }
});

// Root Route for Testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Catch-All Route for Non-Existent Endpoints
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

// Declare port
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
