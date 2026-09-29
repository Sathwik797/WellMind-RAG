const mongoose = require('mongoose');

const decisionLogSchema = new mongoose.Schema(
  {
    wellId: { type: String, required: true, index: true },
    engineerName: { type: String, required: true },
    depth: {type: Number,default: null},
    problem: { type: String, required: true, trim: true },
    solution: { type: String, required: true, trim: true },
    category: { type: String, default: null },
    tags: { type: [String], default: [] },
    date: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DecisionLog', decisionLogSchema);