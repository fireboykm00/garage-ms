import { api } from "@/lib/api"
import type { User, UserRole } from "@/types"

export const userService = {
  getAll: () => api.get<User[]>("/admin/users"),
  create: (data: { username: string; email: string; password: string; fullName: string; role: UserRole }) =>
    api.post<User>("/admin/users", data),
  updateRole: (id: number, role: UserRole) => api.put<User>(`/admin/users/${id}/role`, { role }),
  delete: (id: number) => api.delete(`/admin/users/${id}`),
}
