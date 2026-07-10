// API Service to centralize all network requests to our FastAPI backend.
// This prevents duplicating headers and fetch configurations across our page components.

import { API_BASE_URL } from "../config.js";

const BASE_URL = API_BASE_URL;

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
  
  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch (err) {
    // Network / CORS / cold-start failures — keep status undefined so callers
    // can distinguish these from real auth rejections (401).
    const networkError = new Error(
      err?.message === "Failed to fetch"
        ? "Unable to reach the server. It may be waking up — please try again."
        : err?.message || "Network error"
    );
    networkError.status = 0;
    networkError.isNetworkError = true;
    throw networkError;
  }

  // Handle HTTP errors cleanly
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || "Something went wrong";
    const apiError = new Error(errorMessage);
    apiError.status = response.status;
    throw apiError;
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

  jobs: {
    // Create new job posting
    async create(jobData) {
      return request("/jobs", {
        method: "POST",
        body: JSON.stringify(jobData),
      });
    },

    // List recruiter's job postings
    async list() {
      return request("/jobs");
    },

    // Retrieve single job's details + associated screenings
    async get(id) {
      return request(`/jobs/${id}`);
    },

    // Delete job posting
    async delete(id) {
      return request(`/jobs/${id}`, {
        method: "DELETE",
      });
    },

    // Bulk screen resumes against a job
    async screen(jobId, files) {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      return request(`/jobs/${jobId}/screen`, {
        method: "POST",
        body: formData,
      });
    },

    // Delete a candidate screening report
    async deleteScreening(screeningId) {
      return request(`/jobs/screenings/${screeningId}`, {
        method: "DELETE",
      });
    },

    // Retrieve public job info for candidate apply page
    async getPublicJob(id) {
      return request(`/jobs/${id}/public`);
    },

    // Submit a public job application
    async submitApplication(jobId, name, email, file) {
      const formData = new FormData();
      formData.append("candidate_name", name);
      formData.append("candidate_email", email);
      formData.append("file", file);

      return request(`/jobs/${jobId}/apply`, {
        method: "POST",
        body: formData,
      });
    },
  },
};

