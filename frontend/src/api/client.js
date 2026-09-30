import axios from "axios";

function formatBaseUrl(raw) {
  if (!raw) return "http://localhost:5000/api";
  let url = String(raw).trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/, "");
  return url.endsWith("/api") ? url : `${url}/api`;
}

const baseURL = formatBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL,
});

// Attach the JWT to every request except the three public auth routes.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nwis-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// backend always returns { message, error } on failure — surface `message`.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;