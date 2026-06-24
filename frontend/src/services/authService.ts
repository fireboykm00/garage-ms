import { api } from "@/lib/api"
import type { JwtResponse, LoginRequest, UpdateProfileRequest, User } from "@/types"

export const authService = {
  login: (data: LoginRequest) => api.post<JwtResponse>("/auth/login", data),
  getMe: () => api.get<User>("/auth/me"),
  updateProfile: (data: UpdateProfileRequest) => api.put<User>("/auth/profile", data),
}
