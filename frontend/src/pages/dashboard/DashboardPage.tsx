import { useState, useEffect } from "react"
import { dashboardService } from "@/services/dashboardService"
import { stockService } from "@/services/stockService"
import { partService } from "@/services/partService"
import type { DashboardStats, StockTransaction, JobCard, Part } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package, ArrowDownToLine, ClipboardList, PlayCircle, CheckCircle2,
  Plus, AlertTriangle, Wrench, Clock
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { timeSince } from "@/lib/utils"

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  OPEN: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
}

export function DashboardPage() {
  useDocumentTitle("Dashboard")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [recentJobs, setRecentJobs] = useState<JobCard[]>([])
  const [lowStockParts, setLowStockParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      stockService.getTransactions(),
      dashboardService.getRecentJobs(),
      partService.getLowStock(),
    ])
      .then(([statsRes, txRes, jobsRes, lowRes]) => {
        setStats(statsRes.data)
        setTransactions(txRes.data)
        setRecentJobs(jobsRes.data)
        setLowStockParts(lowRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const inProgressJobs = recentJobs.filter((j) => j.status === "IN_PROGRESS")

  const statCards = stats
    ? [
        { title: "Total Parts", value: stats.totalParts, icon: Package, href: "/parts" },
        { title: "Open Jobs", value: stats.openJobs, icon: ClipboardList, href: "/jobs" },
        { title: "In Progress", value: stats.inProgressJobs, icon: PlayCircle, href: "/jobs" },
        { title: "Completed Today", value: stats.completedToday, icon: CheckCircle2, href: "/jobs" },
      ]
    : []

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Breadcrumbs segments={[{ label: "Dashboard" }]} />
      <div className="flex items-center gap-2">
        <Wrench className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Stat cards row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Link key={stat.title} to={stat.href}>
                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <Icon className="h-4 w-4 text-primary/70" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/jobs/new">
            <Plus className="mr-1 h-4 w-4" /> New Job Card
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/stock/in">
            <ArrowDownToLine className="mr-1 h-4 w-4" /> Stock In
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/parts/new">
            <Package className="mr-1 h-4 w-4" /> Add Part
          </Link>
        </Button>
      </div>

      {/* Low stock + In Progress row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low stock alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Low Stock Alerts
            </CardTitle>
            {stats && stats.lowStockCount > 0 && (
              <Badge variant="destructive">{stats.lowStockCount}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : lowStockParts.length === 0 ? (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                All items are well-stocked
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockParts.map((part) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {part.name || part.partNumber}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {part.partNumber} · Min: {part.minimumQuantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-destructive">
                        {part.currentQuantity}
                      </span>
                      <Button asChild variant="outline" size="sm">
                        <Link to={part.id ? `/stock/in?partId=${part.id}` : "/stock/in"}>
                          <ArrowDownToLine className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* In Progress jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-yellow-600" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : inProgressJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs in progress.</p>
            ) : (
              <div className="space-y-2">
                {inProgressJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{job.jobNumber}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.customerName}{job.vehicleRegistration ? ` · ${job.vehicleRegistration}` : ""}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {timeSince(job.updatedAt || job.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs + Transactions row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Job Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No job cards yet.</p>
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{job.jobNumber}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.customerName}{job.vehicleRegistration ? ` · ${job.vehicleRegistration}` : ""}
                      </p>
                    </div>
                    <Badge variant={statusVariant[job.status] || "outline"}>
                      {statusLabel[job.status] || job.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Part</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Qty</th>
                      <th className="pb-2 font-medium">By</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="py-2">{tx.partName}</td>
                        <td className="py-2">
                          <Badge variant={tx.type === "IN" ? "default" : "destructive"}>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="py-2">{tx.quantity}</td>
                        <td className="py-2 text-muted-foreground">{tx.createdByName}</td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
