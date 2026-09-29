const mongoose = require('mongoose');

// Ground-truth drilling incidents verified by rig-site engineers or drilling superintendents.
// ONLY records in this collection that are human-verified are eligible for continuous learning.
const verifiedIncidentSchema = new mongoose.Schema(
  {
    wellId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    depth: { type: Number, required: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        'mud_loss',
        'stuck_pipe',
        'overpressure',
        'torque_spike',
        'cementing_issue',
        'kick',
        'other'
      ],
    },
    severity: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Critical'],
      default: 'Moderate',
    },
    actualOutcome: { type: String, default: '' },
    nptHours: { type: Number, default: 0 },
    description: { type: String, required: true },
    mitigationApplied: { type: String, default: '' },
    source: { type: String, default: 'DDR/WCR' }, // DDR, WCR, Rig Report, Manual Log
    verifiedBy: { type: String, required: true },
    verifiedAt: { type: Date, default: Date.now },
    usedForTraining: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VerifiedIncident', verifiedIncidentSchema);
