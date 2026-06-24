import { AxiosError } from "axios"
import { ApiError } from "./api"

export interface NormalizedError {
  message: string
  fieldErrors: Record<string, string>
  status?: number
  isNetworkError: boolean
}

export function normalizeError(error: unknown): NormalizedError {
  const fallback: NormalizedError = {
    message: "Something went wrong",
    fieldErrors: {},
    isNetworkError: false,
  }

  if (error instanceof ApiError) {
    return {
      message: error.message,
      fieldErrors: {},
      status: error.status,
      isNetworkError: error.isNetworkError,
    }
  }

  if (!(error instanceof AxiosError)) {
    return fallback
  }

  if (!error.response) {
    return {
      message: "Unable to connect to server. Please check if the backend is running.",
      fieldErrors: {},
      isNetworkError: true,
    }
  }

  const data = error.response.data as Record<string, unknown>
  const status = error.response.status

  if (typeof data?.message === "string") {
    return { message: data.message, fieldErrors: {}, status, isNetworkError: false }
  }

  const fieldErrors: Record<string, string> = {}
  let hasFields = false
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "string") {
      fieldErrors[key] = val
      hasFields = true
    }
  }

  if (hasFields) {
    return { message: "Please correct the highlighted fields", fieldErrors, status, isNetworkError: false }
  }

  return { message: "An unexpected error occurred", fieldErrors: {}, status, isNetworkError: false }
}
