const mongoose = require('mongoose');

// Stores engineer "Simulate a Scenario" runs for historical auditing and scenario comparisons.
// NOTE: These are synthetic what-if simulations and are STRICTLY EXCLUDED from model retraining
// to prevent Model Autophagy Disorder (MAD) / pseudo-label feedback loops.
const scenarioSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'anonymous' },
    userName: { type: String, default: 'Engineer' },
    Well_ID: { type: String, default: 'W001' },
    Timestamp: { type: String, default: '' },
    Depth_MD: Number,
    Depth_TVD: Number,
    Formation: String,
    ROP: Number,
    WOB: Number,
    RPM: Number,
    Torque: Number,
    Standpipe_Pressure: Number,
    Flow_Rate: Number,
    Mud_Weight: Number,
    Plastic_Viscosity: Number,
    Yield_Point: Number,
    Hook_Load: Number,
    Inclination: Number,
    Bit_Type: String,
    Reservoir_Pressure: Number,
    Formation_Pore_Pressure: Number,
    Distance_To_Nearest_Offset_m: Number,
    Historical_Event_Count: Number,
    Previous_Mud_Loss_Count: Number,
    Previous_Stuck_Pipe_Count: Number,
    Previous_Kick_Count: Number,
    Previous_NPT_Count: Number,
    Similar_Well_Risk_Count: Number,

    // Store simulated predictions for auditing only
    predictedRisks: { type: mongoose.Schema.Types.Mixed },
    explanation: { type: mongoose.Schema.Types.Mixed },

    isSimulation: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScenarioSubmission', scenarioSubmissionSchema);