import api from "./client";

export async function getDecisionLogs(wellId) {
  const { data } = await api.get(
    `/wells/${wellId}/decision-logs`
  );

  return data;
}