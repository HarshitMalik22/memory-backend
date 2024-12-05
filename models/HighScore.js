const mongoose = require('mongoose');

const highScoreSchema = new mongoose.Schema({
  username: { type: String, required: true },
  moves: { type: Number, required: true },
  level: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const HighScore = mongoose.model('HighScore', highScoreSchema);

module.exports = HighScore;
