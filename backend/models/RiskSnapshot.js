const mongoose = require("mongoose");

const riskSnapshotSchema = new mongoose.Schema(
  {
    wellId: {
      type: String,
      required: true,
      index: true,
    },

    depth: {
      type: Number,
      required: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    risks: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    level: {
      type: String,
      default: "LOW",
    },

  warnings: { type: mongoose.Schema.Types.Mixed, default: [] },

    recommendation: {
      type: String,
      default: "",
    },

    explanations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

riskSnapshotSchema.index({ wellId: 1, depth: 1 });
riskSnapshotSchema.index({ wellId: 1, timestamp: -1 });

module.exports = mongoose.model("RiskSnapshot", riskSnapshotSchema);