const axios = require('axios');

function getMlBaseUrl() {
  let url = String(process.env.ML_SERVICE_URL || process.env.ML_PREDICT_URL || 'http://localhost:8000').trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url
    .replace(/\/+$/, '')
    .replace(/\/predict\/?$/, '')
    .replace(/\/explain\/?$/, '')
    .replace(/\/realtime-warning\/?$/, '')
    .replace(/\/historical-intelligence\/?$/, '');
}

const ML_BASE = getMlBaseUrl();
const ML_PREDICT_URL = `${ML_BASE}/predict`;
const ML_EXPLAIN_URL = `${ML_BASE}/explain`;
const ML_REALTIME_WARNING_URL = `${ML_BASE}/realtime-warning`;
const ML_HISTORICAL_URL = `${ML_BASE}/historical-intelligence`;

console.log("ML_BASE =", ML_BASE);

const mlAxios = axios.create({ timeout: 240000 });
const cleanPayload = (record) => {
  return {
    Well_ID: record.Well_ID,
    Timestamp: record.Timestamp,
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
    Historical_Event_Count: record.Historical_Event_Count,

    // ADD THESE
    Previous_Mud_Loss_Count: record.Previous_Mud_Loss_Count ?? 0,
    Previous_Stuck_Pipe_Count: record.Previous_Stuck_Pipe_Count ?? 0,
    Previous_Kick_Count: record.Previous_Kick_Count ?? 0,
    Previous_NPT_Count: record.Previous_NPT_Count ?? 0,
    Similar_Well_Risk_Count: record.Similar_Well_Risk_Count ?? 0,
  };
};

const getRiskExplanation = async (record) => {
  const payload = cleanPayload(record);
  try {
    const response = await mlAxios.post(ML_EXPLAIN_URL, payload);
    return response.data;
  // } catch (error) {
  //   console.error('Explain API call failed:', error.message);
  //   throw new Error('Risk explanation service is currently unavailable. Please try again.');
  // }
  }catch (error) {
  console.error("Explain API call failed:", {
    status: error.response?.status,
    data: error.response?.data,
    headers: error.response?.headers,
    url: ML_EXPLAIN_URL,
    message: error.message,
  });

  throw new Error(
    'Risk explanation service is currently unavailable. Please try again.'
  );
}
};

const getRiskPrediction = async (record) => {
  const payload = cleanPayload(record);

  console.log('PAYLOAD SENT FROM NODE TO PYTHON:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await mlAxios.post(ML_PREDICT_URL, payload);

    console.log('PYTHON /predict RESPONSE:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;

  // } catch (error) {
  //   console.error(
  //     'Predict API call failed:',
  //     error.response?.data || error.message
  //   );

  //   throw new Error(
  //     'Risk prediction service is currently unavailable. Please try again.'
  //   );
  // }
  }catch (error) {
  console.error("Predict API call failed:", {
    status: error.response?.status,
    data: error.response?.data,
    headers: error.response?.headers,
    url: ML_PREDICT_URL,
    message: error.message,
  });

  throw new Error(
    'Risk prediction service is currently unavailable. Please try again.'
  );
}
};

const getHistoricalAnswer = async (question, wellIds) => {
  try {
    const response = await mlAxios.post(ML_HISTORICAL_URL, { question, well_ids: wellIds });
    return response.data;
  } catch (error) {
    console.error('Historical API call failed:', error.message);
    throw new Error('Historical search is currently unavailable. Please try again.');
  }
};


module.exports = {
  getRiskPrediction,
  getRiskExplanation,
  getHistoricalAnswer,
  ML_REALTIME_WARNING_URL,
  ML_BASE,
};