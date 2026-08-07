import axios from "axios";

// In local dev, Vite proxies "/api" to the backend (see vite.config.js).
// In production, there's no dev proxy, so we point straight at the deployed
// backend URL via an env var set at build time (see .env.production.example).
const API_URL = import.meta.env.VITE_API_URL || "";
const baseURL = API_URL ? `${API_URL}/api` : "/api";

const api = axios.create({ baseURL });

// Item photos are stored as relative paths like "/uploads/xyz.jpg". Locally
// the dev proxy resolves those against the backend automatically; in
// production the frontend and backend are on different domains, so this
// turns a relative upload path into an absolute one pointing at the API.
export function resolveImage(path) {
  if (!path) return null;
  return API_URL ? `${API_URL}${path}` : path;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error messages so components can just read err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;
