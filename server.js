const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const HighScore = require('./models/HighScore');
const cors = require('cors');
const auth = require('./middleware/auth');
const config = require('config');
const app = express();

// CORS Middleware Configuration
const corsOptions = {
  origin: ['https://memory-frontend-delta.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Connect to the Database with error handling
(async () => {
  try {
    await connectDB();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1); // Exit the process if DB connection fails
  }
})();

// Initialize middleware for JSON parsing
app.use(express.json());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/history', require('./routes/history'));

// High Score Routes
// Update or Create High Score
app.post('/api/highscore', auth, async (req, res) => {
  try {
    const { username, moves, level } = req.body;

    // Input validation
    if (!username || !moves || !level) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (typeof username !== 'string' || typeof moves !== 'number' || typeof level !== 'string' || moves < 0) {
      return res.status(400).json({ message: 'Invalid data types or moves must be non-negative' });
    }

    // Find the user's existing high score for the level
    let highScore = await HighScore.findOne({ username, level });

    if (!highScore) {
      // If no high score exists, create a new one
      highScore = new HighScore({ username, moves, level });
      await highScore.save();
      return res.status(201).json({ message: 'New high score created for user' });
    }

    // Update if the new score is better (lower moves are better)
    if (moves < highScore.moves || highScore.moves === 0) {
      highScore.moves = moves;
      await highScore.save();
      return res.status(200).json({ message: 'High score updated successfully' });
    }

    // If the new score is not better, return a message
    res.status(200).json({ message: 'High score not updated because an existing high score is lower or equal' });
  } catch (error) {
    console.error('Error submitting high score:', error.message);
    res.status(500).json({ message: 'Error submitting high score', error: error.message });
  }
});

// Retrieve High Score for a User and Level
app.get('/api/highscore/:level', auth, async (req, res) => {
  const { level } = req.params;

  try {
    // Find the high score for the user at the specified level
    const highScore = await HighScore.findOne({ username: req.user.username, level });

    if (highScore) {
      return res.json(highScore); // Return the high score data
    }

    // If no high score exists, return "not played yet"
    res.status(404).json({ message: 'Not played yet' });
  } catch (error) {
    console.error('Error retrieving high scores:', error.message);
    res.status(500).json({ message: 'Error retrieving high scores', error: error.message });
  }
});

// Root Route for Testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware for unexpected issues
app.use((err, req, res, next) => {
  console.error('Unexpected Error:', err.message); // Log the unexpected error
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: err.message,
  });
});

// Declare port
const PORT = process.env.PORT || 8080;

// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

