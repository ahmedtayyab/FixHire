// API Service to centralize all network requests to our FastAPI backend.
// This prevents duplicating headers and fetch configurations across our page components.

const BASE_URL = "http://localhost:8000/api";

/**
 * Core request helper that automatically injects the JWT token
 * from localStorage if it exists, ensuring authenticated routes work seamlessly.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("fixhire_token");
  
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers,
  };
  
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  // Handle HTTP errors cleanly
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || "Something went wrong";
    throw new Error(errorMessage);
  }
  
  return response.json();
}

export const api = {
  auth: {
    // Registers a new user. Returns user details.
    async register(fullName, email, password, role) {
      return request("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password,
          role: role,
        }),
      });
    },
    
    // Logs in a user. Returns access token and user metadata.
    async login(email, password) {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    
    // Re-hydrates state by fetching the current user using the saved token.
    async getMe() {
      return request("/auth/me");
    },
  },

  analysis: {
    // Analyze resume file + job title and description
    async analyze(jobTitle, jobDescription, file) {
      const formData = new FormData();
      formData.append("job_title", jobTitle);
      formData.append("job_description", jobDescription);
      formData.append("file", file);

      return request("/analysis/analyze", {
        method: "POST",
        body: formData,
      });
    },

    // Retrieve history list
    async getHistory() {
      return request("/analysis/history");
    },

    // Delete past analysis
    async deleteAnalysis(id) {
      return request(`/analysis/${id}`, {
        method: "DELETE",
      });
    },
  },
};
