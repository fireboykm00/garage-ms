import { api } from "@/lib/api"
import type { StockOutReport, RemainingStockReport, AggregatedStockOutReport } from "@/types"

export const reportService = {
  getStockOutReport: () => api.get<StockOutReport[]>("/reports/stock-out"),
  getRemainingStockReport: () => api.get<RemainingStockReport[]>("/reports/remaining-stock"),
  getAggregatedStockOutReport: () => api.get<AggregatedStockOutReport[]>("/reports/stock-out/aggregated"),
}
