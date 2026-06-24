import axios, { type AxiosError } from "axios";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export class ApiError extends Error {
  status?: number;
  isNetworkError: boolean;

  constructor(message: string, status?: number, isNetworkError: boolean = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};

// Debounce guard to prevent duplicate toasts for the same error type
let lastToastTime = 0;
const TOAST_DEBOUNCE_MS = 2000;

function showDebouncedToast(message: string) {
  const now = Date.now();
  if (now - lastToastTime > TOAST_DEBOUNCE_MS) {
    toast.error(message);
    lastToastTime = now;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error)) {
      if (!error.response) {
        const message = "Unable to connect to server. Please check if the backend is running.";
        toast.error(message);
        return Promise.reject(new ApiError(message, undefined, true));
      }

      const status = error.response.status;

      if (status === 401) {
        showDebouncedToast("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(new ApiError("Session expired", 401));
      }

      if (status === 403) {
        showDebouncedToast("You don't have permission to perform this action");
        return Promise.reject(new ApiError("Access denied", 403));
      }

      if (status >= 500) {
        const message = "Server error. Please try again later.";
        toast.error(message);
        return Promise.reject(new ApiError(message, status));
      }

      // For 400-499 that aren't 401/403: try to extract message or field errors
      if (status >= 400 && status < 500) {
        const data = error.response?.data as Record<string, unknown> | undefined;
        if (!data) {
          return Promise.reject(new ApiError("Request failed", status));
        }
        // Known field-name keys that indicate a field-level validation response
        const fieldKeys = ["partNumber", "ourPartNumber", "name", "model", "manufacturer", "unit", "stockId",
          "currentQuantity", "minimumQuantity", "username", "email", "fullName", "password", "role",
          "customerName", "jobNumber", "partId", "quantity", "note"];
        const hasFieldKey = Object.keys(data).some(k => fieldKeys.includes(k));
        if (hasFieldKey) {
          // Contains field-level errors — let raw AxiosError pass through for page-level handling
          return Promise.reject(error);
        }
        // Pure message response — convert to ApiError
        if (typeof data.message === "string") {
          return Promise.reject(new ApiError(data.message, status));
        }
        return Promise.reject(new ApiError("Request failed", status));
      }

      return Promise.reject(error);
    }
    
    toast.error("An unexpected error occurred");
    return Promise.reject(error);
  }
);

export default api;
