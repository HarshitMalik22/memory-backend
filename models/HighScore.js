const mongoose = require('mongoose');

const highScoreSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    moves: { type: Number, required: true },
    level: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Ensure unique high score for each user and level combination
highScoreSchema.index({ username: 1, level: 1 }, { unique: true });

const HighScore = mongoose.model('HighScore', highScoreSchema);

module.exports = HighScore;
