const mongoose = require('mongoose');
const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    employeeName: { type: String, required: true, trim: true },
    password: { type: String },
    role: {
      type: String,
      enum: ['office', 'field'],
      required: true,
    },
    position: {
      type: String,
      default: ''
    },

    yearsOfExperience: {
      type: Number,
      default: 0
    },

    directorate: {
      type: String,
      default: ''
    },
    // NEW fields for Google login
    googleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Employee', employeeSchema);
