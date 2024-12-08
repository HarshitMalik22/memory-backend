const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const HighScore = require("./models/HighScore"); // High score model import
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// CORS Middleware Configuration
const corsOptions = {
  origin: ["https://memory-frontend-delta.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  credentials: true,
};

// Apply CORS Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Connect to the Database
(async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
})();

// Middleware for Parsing JSON Requests
app.use(express.json());

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/history", require("./routes/history"));

// High Score Routes

// Update or Create High Score
app.post("/api/highscore", async (req, res) => {
  try {
    const { username, moves, level } = req.body;

    // Validate Input Data
    if (!username || !moves || !level) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (
      typeof username !== "string" ||
      typeof moves !== "number" ||
      typeof level !== "string" ||
      moves < 0
    ) {
      return res.status(400).json({
        message: "Invalid data types or moves must be non-negative",
      });
    }

    // Find Existing High Score for the User and Level
    let highScore = await HighScore.findOne({ username, level });

    if (!highScore) {
      // Create a New High Score
      highScore = new HighScore({ username, moves, level });
      await highScore.save();
      return res.status(201).json({ message: "New high score created for user" });
    }

    // Update High Score if New Score is Better
    if (moves < highScore.moves || highScore.moves === 0) {
      highScore.moves = moves;
      await highScore.save();
      return res.status(200).json({ message: "High score updated successfully" });
    }

    // Return Message if New Score is Not Better
    res.status(200).json({
      message: "High score not updated because an existing high score is lower or equal",
    });
  } catch (error) {
    console.error("Error submitting high score:", error.message);
    res.status(500).json({ message: "Error submitting high score", error: error.message });
  }
});

// Retrieve High Score for a User and Level
const jwt = require('jsonwebtoken');
const HighScore = require('./models/highscore'); // Ensure this is correct

app.get('/api/highscore/:level', async (req, res) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).send({ message: 'Token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { username } = decoded;
    const { level } = req.params;

    const highScore = await HighScore.findOne({ username, level });
    if (!highScore) {
      return res.status(404).send({ moves: null, message: 'No high score yet' });
    }

    res.send({ moves: highScore.moves });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error retrieving high scores', error: error.message });
  }
});

// Root Route for Testing
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unexpected Error:", err.message);
  res.status(500).json({
    message: "Something went wrong on the server",
    error: err.message,
  });
});

// Server Initialization
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
