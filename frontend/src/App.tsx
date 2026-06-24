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

import { StockOutReportPage } from "@/pages/reports/StockOutReportPage"
import { RemainingStockReportPage } from "@/pages/reports/RemainingStockReportPage"
import { AdminUsersPage } from "@/pages/users/AdminUsersPage"
import { useAuth } from "@/hooks/useAuth"

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobCardListPage />} />
        <Route path="/jobs/new" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER", "ROLE_RECEPTIONIST"]}><JobCardFormPage /></RoleRoute>} />
        <Route path="/jobs/:id" element={<JobCardDetailPage />} />

        {/* Stock-based routing (primary) */}
        <Route path="/stocks" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER", "ROLE_MECHANIC"]}><StocksPage /></RoleRoute>} />
        <Route path="/stocks/:stockId/parts" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER", "ROLE_MECHANIC"]}><StockDetailPage /></RoleRoute>} />
        <Route path="/stocks/:stockId/parts/new" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER"]}><PartFormPage /></RoleRoute>} />
        <Route path="/stocks/:stockId/parts/:partId/edit" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER"]}><PartFormPage /></RoleRoute>} />

        {/* Backward-compat part routes (redirect to stocks) */}
        <Route path="/parts" element={<Navigate to="/stocks" replace />} />
        <Route path="/parts/new" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER"]}><PartFormPage /></RoleRoute>} />
        <Route path="/parts/:id/edit" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER"]}><PartFormPage /></RoleRoute>} />

        <Route path="/stock/in" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER"]}><StockInPage /></RoleRoute>} />
        <Route path="/stock/in/transactions" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER"]}><StockInTransactionsPage /></RoleRoute>} />

        <Route path="/reports/stock-out" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER", "ROLE_MECHANIC"]}><StockOutReportPage /></RoleRoute>} />
        <Route path="/reports/remaining-stock" element={<RoleRoute roles={["ROLE_ADMIN", "ROLE_STOREKEEPER", "ROLE_MECHANIC"]}><RemainingStockReportPage /></RoleRoute>} />
        <Route path="/admin/users" element={<RoleRoute roles={["ROLE_ADMIN"]}><AdminUsersPage /></RoleRoute>} />
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
