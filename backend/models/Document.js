const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well' },
  title: String,
  rawText: String,
  extracted: {
    depth: Number,
    event: String,          // "mud loss", "stuck pipe", etc.
    cause: String,
    mitigation: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);