import api from "./client";
export async function getAlerts(wellId) {
  const { data } = await api.get("/alerts", { params: wellId ? { wellId } : {} });
  return data.alerts;
}
export async function markAlertRead(id) {
  const { data } = await api.patch(`/alerts/${id}/read`);
  return data;
}

export async function markAllRead() {
  const { data } = await api.patch("/alerts/read-all");
  return data;
}