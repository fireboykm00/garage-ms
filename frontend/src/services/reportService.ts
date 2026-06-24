import { api } from "@/lib/api"
import type { StockOutReport, RemainingStockReport } from "@/types"

export const reportService = {
  getStockOutReport: () => api.get<StockOutReport[]>("/reports/stock-out"),
  getRemainingStockReport: () => api.get<RemainingStockReport[]>("/reports/remaining-stock"),
}
