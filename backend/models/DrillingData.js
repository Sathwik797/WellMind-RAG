const mongoose = require('mongoose');

const drillingDataSchema = new mongoose.Schema({
  Well_ID: String,
  Timestamp:  {
  type: Date,
  default: Date.now,
},
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

  // Required ML input features
  Previous_Mud_Loss_Count: Number,
  Previous_Stuck_Pipe_Count: Number,
  Previous_Kick_Count: Number,
  Previous_NPT_Count: Number,
  Similar_Well_Risk_Count: Number,

  // Required by your current ML API
  Kick_Label: Number,
  Fishing_Label: Number,

  // Actual outcomes / reference only
  Mud_Loss_Label: Number,
  Stuck_Pipe_Label: Number,
  Overpressure_Label: Number,
  Torque_Spike_Label: Number,
  Cementing_Issue_Label: Number,
});

module.exports = mongoose.model('DrillingData', drillingDataSchema);