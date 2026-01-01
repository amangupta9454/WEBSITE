// backend/models/Counter.js

const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g., "internship_2026"
  seq: { type: Number, default: 1 }
});

// Correct export — this is critical!
const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;