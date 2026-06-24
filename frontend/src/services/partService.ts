import { api } from "@/lib/api"
import type { Part, PartRequest } from "@/types"

export const partService = {
  getAll: () => api.get<Part[]>("/parts"),
  getById: (id: number) => api.get<Part>(`/parts/${id}`),
  getLowStock: () => api.get<Part[]>("/parts/low-stock"),
  create: (data: PartRequest) => api.post<Part>("/parts", data),
  update: (id: number, data: PartRequest) => api.put<Part>(`/parts/${id}`, data),
  delete: (id: number) => api.delete(`/parts/${id}`),
}
