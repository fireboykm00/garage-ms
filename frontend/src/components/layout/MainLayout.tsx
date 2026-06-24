import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "./Sidebar"
import { MobileNav } from "./MobileNav"
import { Toaster } from "@/components/ui/sonner"
import { useEffect } from "react"

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Track job card visits for recent items in sidebar
  useEffect(() => {
    const match = location.pathname.match(/^\/jobs\/(\d+)$/)
    if (match) {
      try {
        const stored = JSON.parse(localStorage.getItem("recentJobs") || "[]")
        const entry = { label: `Job #${match[1]}`, to: location.pathname }
        const updated = [entry, ...stored.filter((s: { to: string }) => s.to !== entry.to)].slice(0, 5)
        localStorage.setItem("recentJobs", JSON.stringify(updated))
      } catch {
        // ignore
      }
    }
  }, [location.pathname])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <div className="container mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
      <MobileNav />
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
