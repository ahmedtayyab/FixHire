// Backend origin without trailing slash. Override in production via VITE_API_URL.
const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export const API_BASE_URL = `${API_ORIGIN}/api`;
export { API_ORIGIN };
