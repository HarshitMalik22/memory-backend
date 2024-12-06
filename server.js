const express = require('express');
const connectDB = require('./config/db');
const HighScore = require('./models/HighScore'); // High score model import
const cors = require('cors'); // Import cors
const app = express();

// Connect to the database
connectDB();

// Use CORS middleware and configure it to allow requests from your frontend domain
app.use(
  cors({
    origin: 'https://memory-frontend-delta.vercel.app', // Replace this with your actual frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    credentials: true, // Enable sending cookies with cross-origin requests, if needed
  })
);

// Initialize middleware to parse JSON
app.use(express.json());

// Define API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/history', require('./routes/history'));

// High Score Routes
app.post('/api/highscore', async (req, res) => {
  try {
    const { username, moves, level } = req.body;

    if (!username || !moves || !level) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (typeof username !== 'string' || typeof moves !== 'number' || typeof level !== 'string' || moves <= 0) {
      return res.status(400).json({ message: 'Invalid data types or moves must be positive' });
    }

    const existingHighScore = await HighScore.findOne({ level }).sort({ moves: 1 });

    if (!existingHighScore || moves < existingHighScore.moves) {
      const newHighScore = new HighScore({ username, moves, level });
      await newHighScore.save();
      return res.status(201).json({ message: 'New high score submitted successfully' });
    }

    res.status(200).json({ message: 'High score not updated because an existing high score is lower' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting high score', error: error.message });
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
    res.status(500).json({ message: 'Error retrieving high scores', error: error.message });
  }
});

// Set up the port for the backend
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Backend server started on port ${PORT}`));
