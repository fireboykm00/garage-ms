import { api } from "@/lib/api"
import type { DashboardStats, JobCard } from "@/types"

export const dashboardService = {
  getStats: () => api.get<DashboardStats>("/dashboard/stats"),
  getRecentJobs: () => api.get<JobCard[]>("/dashboard/recent-jobs"),
}
