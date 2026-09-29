import axios from "axios";

const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const baseURL = rawUrl.replace(/\/+$/, "").endsWith("/api")
  ? rawUrl.replace(/\/+$/, "")
  : `${rawUrl.replace(/\/+$/, "")}/api`;

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