// const mongoose = require('mongoose');

// const alertSchema = new mongoose.Schema({
//   wellId: { type: String, required: true },
//   depth: Number,
//   level: String, // HIGH / MEDIUM / LOW
//   warnings: Array,
//   historicalEvents: Array,
//   recommendation: String,
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Alert', alertSchema);

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  wellId: { type: String, required: true },
  depth: Number,
  level: String,
  warnings: Array,
  historicalEvents: Array,
  recommendation: String,
  read: { type: Boolean, default: false }, // ADD THIS
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Alert', alertSchema);