// Backend origin without trailing slash. Override in production via VITE_API_URL.
const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export const API_BASE_URL = `${API_ORIGIN}/api`;
export { API_ORIGIN };

// Author / social links (override in production via Vercel env vars if needed)
export const GITHUB_URL = import.meta.env.VITE_GITHUB_URL || "https://github.com/ahmedtayyab";
export const LINKEDIN_URL = import.meta.env.VITE_LINKEDIN_URL || "https://www.linkedin.com/in/ahmadtayyab/";
