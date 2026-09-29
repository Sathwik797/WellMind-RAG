const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
 wellId: { type: String, required: true, index: true },
  depth: Number,
  type: String,       // "mud loss", "stuck pipe", "kick", etc.
  description: String,
  mitigation: String,
  date: Date,
  loggedBy: { type: String, required: true },
});

module.exports = mongoose.model('Event', eventSchema);