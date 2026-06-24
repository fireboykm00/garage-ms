import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"
import { MainLayout } from "@/components/layout/MainLayout"
import { LoginPage } from "@/pages/auth/LoginPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { PartFormPage } from "@/pages/parts/PartFormPage"
import { StocksPage } from "@/pages/stocks/StocksPage"
import { StockDetailPage } from "@/pages/stocks/StockDetailPage"
import { JobCardListPage } from "@/pages/jobs/JobCardListPage"
import { JobCardFormPage } from "@/pages/jobs/JobCardFormPage"
import { JobCardDetailPage } from "@/pages/jobs/JobCardDetailPage"
import { StockInPage } from "@/pages/stock/StockInPage"
import { StockInTransactionsPage } from "@/pages/stock/StockInTransactionsPage"
import { StockOutPage } from "@/pages/stock/StockOutPage"
import { StockOutReportPage } from "@/pages/reports/StockOutReportPage"
import { RemainingStockReportPage } from "@/pages/reports/RemainingStockReportPage"
import { AdminUsersPage } from "@/pages/users/AdminUsersPage"
import { useAuth } from "@/contexts/AuthContext"

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobCardListPage />} />
        <Route path="/jobs/new" element={<JobCardFormPage />} />
        <Route path="/jobs/:id" element={<JobCardDetailPage />} />

        {/* Stock-based routing (primary) */}
        <Route path="/stocks" element={<StocksPage />} />
        <Route path="/stocks/:stockId/parts" element={<StockDetailPage />} />
        <Route path="/stocks/:stockId/parts/new" element={<PartFormPage />} />
        <Route path="/stocks/:stockId/parts/:partId/edit" element={<PartFormPage />} />

        {/* Backward-compat part routes (redirect to stocks) */}
        <Route path="/parts" element={<Navigate to="/stocks" replace />} />
        <Route path="/parts/new" element={<PartFormPage />} />
        <Route path="/parts/:id/edit" element={<PartFormPage />} />

        <Route path="/stock/in" element={<StockInPage />} />
        <Route path="/stock/in/transactions" element={<StockInTransactionsPage />} />
        <Route path="/stock/out" element={<AdminRoute><StockOutPage /></AdminRoute>} />
        <Route path="/reports/stock-out" element={<StockOutReportPage />} />
        <Route path="/reports/remaining-stock" element={<RemainingStockReportPage />} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
