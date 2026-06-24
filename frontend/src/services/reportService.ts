import { api } from "@/lib/api"
import type { StockOutReport, RemainingStockReport, AggregatedStockOutReport, AggregatedStockInReport, StockInReport } from "@/types"

export const reportService = {
  getStockOutReport: () => api.get<StockOutReport[]>("/reports/stock-out"),
  getRemainingStockReport: () => api.get<RemainingStockReport[]>("/reports/remaining-stock"),
  getAggregatedStockOutReport: () => api.get<AggregatedStockOutReport[]>("/reports/stock-out/aggregated"),
  getAggregatedStockInReport: () => api.get<AggregatedStockInReport[]>("/reports/stock-in/aggregated"),
  getStockInReport: () => api.get<StockInReport[]>("/reports/stock-in"),
}
