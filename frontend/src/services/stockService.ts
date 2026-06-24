import { api } from "@/lib/api"
import type { StockInRequest, StockOutRequest, StockTransaction } from "@/types"

export const stockService = {
  stockIn: (data: StockInRequest) => api.post<StockTransaction>("/stock/in", data),
  stockOut: (data: StockOutRequest) => api.post<StockTransaction>("/stock/out", data),
  getTransactions: () => api.get<StockTransaction[]>("/stock/transactions"),
  undoTransaction: (id: number) => api.post<StockTransaction>(`/stock/undo/${id}`),
}
