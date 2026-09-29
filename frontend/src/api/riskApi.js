import api from "./client";

// GET /api/risk/:wellId — { wellId, timestamp, depth, formation, prediction: {...} }
export async function getRiskPrediction(wellId) {
  const { data } = await api.get(`/risk/${wellId}`);
  return data;
}

// GET /api/risk/:wellId/explain — { wellId, timestamp, depth, explanation: {...} }
export async function getRiskExplanation(wellId) {
  const { data } = await api.get(`/risk/${wellId}/explain`);
  return data;
}

// POST /api/risk/simulate
export async function simulateScenario(payload) {
  const { data } = await api.post("/risk/simulate", payload);
  return data; // { prediction: { Mud_Loss_Label: {...}, ... } }
}

// GET /api/risk/:wellId/timeseries — { wellId, depths: [...], series: {...} }
export async function getRiskTimeseries(wellId) {
  const { data } = await api.get(`/risk/${wellId}/timeseries`);
  return data;
}