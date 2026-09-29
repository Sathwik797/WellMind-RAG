const mongoose = require('mongoose');

const wellDocumentSchema = new mongoose.Schema(
  {
    documentId: { type: String, required: true, unique: true },
    filename: String,
    uploadedBy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('WellDocument', wellDocumentSchema);