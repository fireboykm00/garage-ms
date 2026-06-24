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

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(new ApiError("Session expired", 401));
      }

      if (error.response?.status && error.response.status >= 500) {
        const message = "Server error. Please try again later.";
        toast.error(message);
        return Promise.reject(new ApiError(message, error.response.status));
      }

      return Promise.reject(error);
    }
    
    toast.error("An unexpected error occurred");
    return Promise.reject(error);
  }
);

export default api;