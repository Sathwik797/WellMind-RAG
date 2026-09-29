import api from "./client";

// GET /api/wells/search?q=  — used by the Well Select screen's search box.
export async function searchWellsReal(query) {
  if (!query) return [];
  const { data } = await api.get("/wells/search", { params: { q: query } });
  return data.wells;
}

// POST /api/wells — create a new well.
export async function createWellReal(payload) {
  const { data } = await api.post("/wells", payload);
  return data;
}

// GET /api/wells/:wellId — full well document, includes GeoJSON `location`.
export async function getWellByWellId(wellId) {
  const { data } = await api.get(`/wells/${wellId}`);
  return data;
}

// GET /api/wells/nearby?lat=&lng=&radius=
export async function getNearbyWellsReal(lat, lng, radiusKm) {
  const { data } = await api.get("/wells/nearby", {
    params: { lat, lng, radius: radiusKm },
  });
  return data.wells;
}

// GET /api/wells/similar/:wellId?limit=
export async function getSimilarWellsReal(wellId, limit = 5) {
  const { data } = await api.get(`/wells/similar/${wellId}`, { params: { limit } });
  return data.similarWells;
}

// GET /api/wells/:wellId/full
export async function getWellFullDetails(wellId) {
  const { data } = await api.get(`/wells/${wellId}/full`);
  return data;
}

// GET /api/wells/:wellId/events
export async function getWellEvents(wellId) {
  const { data } = await api.get(`/wells/${wellId}/events`);
  return data.events;
}

// POST /api/wells/:wellId/decision-logs — field role only
export async function submitDecisionLogReal(wellId, payload) {
  const { data } = await api.post(`/wells/${wellId}/decision-logs`, payload);
  return data;
}

// GET /api/wells/:wellId/decision-logs
export async function getDecisionLogsReal(wellId) {
  const { data } = await api.get(`/wells/${wellId}/decision-logs`);
  return data.logs;
}