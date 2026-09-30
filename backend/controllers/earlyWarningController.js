const axios = require('axios');
const Well = require('../models/Well');
const DrillingData = require('../models/DrillingData');
const { ML_REALTIME_WARNING_URL } = require('../utils/mlService');

const cleanDrillingData = (record) => ({
  Well_ID: record.Well_ID,
  Timestamp: new Date(record.Timestamp).toISOString().slice(0, 19).replace('T', ' '),
  Depth_MD: record.Depth_MD,
  Depth_TVD: record.Depth_TVD,
  Formation: record.Formation,
  ROP: record.ROP,
  WOB: record.WOB,
  RPM: record.RPM,
  Torque: record.Torque,
  Standpipe_Pressure: record.Standpipe_Pressure,
  Flow_Rate: record.Flow_Rate,
  Mud_Weight: record.Mud_Weight,
  Plastic_Viscosity: record.Plastic_Viscosity,
  Yield_Point: record.Yield_Point,
  Hook_Load: record.Hook_Load,
  Inclination: record.Inclination,
  Bit_Type: record.Bit_Type,
  Reservoir_Pressure: record.Reservoir_Pressure,
  Formation_Pore_Pressure: record.Formation_Pore_Pressure,
  Distance_To_Nearest_Offset_m: record.Distance_To_Nearest_Offset_m,
  Historical_Event_Count: record.Historical_Event_Count ?? 0,
  Previous_Mud_Loss_Count: record.Previous_Mud_Loss_Count ?? 0,
  Previous_Stuck_Pipe_Count: record.Previous_Stuck_Pipe_Count ?? 0,
  Previous_Kick_Count: record.Previous_Kick_Count ?? 0,
  Previous_NPT_Count: record.Previous_NPT_Count ?? 0,
  Similar_Well_Risk_Count: record.Similar_Well_Risk_Count ?? 0,
});

const checkAndGenerateWarning = async (wellId) => {
  const targetWell = await Well.findOne({ wellId });

  if (!targetWell) {
    throw new Error('Well not found');
  }

  const latestRecord = await DrillingData.findOne({
    Well_ID: wellId
  }).sort({ Timestamp: -1 });

  if (!latestRecord) {
    throw new Error('No drilling data found for this well');
  }

  const payload = cleanDrillingData(latestRecord);

  const response = await axios.post(
    ML_REALTIME_WARNING_URL,
    payload
  );

  return {
    wellId,
    depth: latestRecord.Depth_MD,
    risks: response.data.risks,
    level: response.data.early_warning.level,
    warnings: response.data.early_warning.warnings,
    recommendation: response.data.recommendation
  };
};

exports.getEarlyWarning = async (req, res) => {
  try {
    const { wellId } = req.params;

    const result = await checkAndGenerateWarning(wellId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Early warning error:', error.message);

    res.status(500).json({
      message: 'Error generating early warning',
      error: error.response?.data || error.message
    });
  }
};

exports.checkAndGenerateWarning = checkAndGenerateWarning;