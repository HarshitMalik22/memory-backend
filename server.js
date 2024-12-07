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
      console.error(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Connect DB
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/history', require('./routes/history'));

// High Score Route
app.post('/api/highscore', async (req, res) => {
  console.log('High score POST route accessed');
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
    console.error('Error in High Score POST:', error.message);
    res
      .status(500)
      .json({ message: 'Error submitting high score', error: error.message });
  }
});

app.get('/api/highscore/:level', async (req, res) => {
  console.log('High score GET route accessed');
  const { level } = req.params;
  try {
    const highScores = await HighScore.find({ level }).sort({ moves: 1 }).limit(1);
    if (highScores.length > 0) {
      return res.json(highScores[0]);
    }
    res.status(404).json({ message: 'No high score found for this level' });
  } catch (error) {
    console.error('Error in High Score GET:', error.message);
    res
      .status(500)
      .json({ message: 'Error retrieving high scores', error: error.message });
  }
});

// Root Route
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.send('API is running...');
});

// Catch-All Route
app.use((req, res) => {
  console.warn('404 - Endpoint not found:', req.originalUrl);
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

// Port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
