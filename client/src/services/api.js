import axios from "axios";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      error.message =
        "Network error. Please check your connection and ensure the server is running.";
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Only redirect if not already on login/register page
      const currentPath = window.location.pathname;

      if (currentPath === "/login" || currentPath === "/register") {
        error.message =
          error.response?.data?.message || "Authentication failed";
        return Promise.reject(error);
      }

      localStorage.removeItem("token");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Handle forbidden errors
    if (error.response?.status === 403) {
      error.message =
        error.response?.data?.message ||
        "You do not have permission to perform this action.";
    }

    // Handle not found errors
    if (error.response?.status === 404) {
      error.message =
        error.response?.data?.message ||
        "The requested resource was not found.";
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      error.message =
        typeof error.response.data === "string"
          ? error.response.data
          : error.response?.data?.message ||
            "Too many requests. Please try again later.";
      return Promise.reject(error);
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      error.message = "Server error. Please try again later.";
    }

    return Promise.reject(error);
  },
);

export default api;
