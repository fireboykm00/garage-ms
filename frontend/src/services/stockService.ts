import { api } from "@/lib/api"
import type { StockInRequest, StockOutRequest, StockTransaction, Stock, Part } from "@/types"

export const stockService = {
  // Stock CRUD
  getAll: () => api.get<Stock[]>("/stocks"),
  getById: (id: number) => api.get<Stock>(`/stocks/${id}`),
  create: (data: { name: string; description?: string }) => api.post<Stock>("/stocks", data),
  update: (id: number, data: { name: string; description?: string }) => api.put<Stock>(`/stocks/${id}`, data),
  delete: (id: number) => api.delete(`/stocks/${id}`),
  getParts: (id: number) => api.get<Part[]>(`/stocks/${id}/parts`),

  // Transaction methods
  stockIn: (data: StockInRequest) => api.post<StockTransaction>("/stock/in", data),
  stockOut: (data: StockOutRequest) => api.post<StockTransaction>("/stock/out", data),
  getTransactions: () => api.get<StockTransaction[]>("/stock/transactions"),
  undoTransaction: (id: number) => api.post<StockTransaction>(`/stock/undo/${id}`),
}
