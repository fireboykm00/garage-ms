import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { dashboardService } from "@/services/dashboardService"
import { stockService } from "@/services/stockService"
import type { DashboardStats, StockTransaction, JobCard } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Wrench, ClipboardList, PlayCircle, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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
  const { isAdmin, isStorekeeper } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [recentJobs, setRecentJobs] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      stockService.getTransactions(),
      dashboardService.getRecentJobs(),
    ])
      .then(([statsRes, txRes, jobsRes]) => {
        setStats(statsRes.data)
        setTransactions(txRes.data)
        setRecentJobs(jobsRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats
    ? [
        { title: "Total Parts", value: stats.totalParts, icon: Package, color: "text-blue-600" },
        { title: "Open Jobs", value: stats.openJobs, icon: ClipboardList, color: "text-purple-600" },
        { title: "In Progress", value: stats.inProgressJobs, icon: PlayCircle, color: "text-yellow-600" },
        { title: "Completed Today", value: stats.completedToday, icon: CheckCircle2, color: "text-green-600" },
        { title: "Stock In", value: stats.totalStockIn, icon: ArrowDownToLine, color: "text-emerald-600" },
        { title: "Stock Out", value: stats.totalStockOut, icon: ArrowUpFromLine, color: "text-orange-600" },
        { title: "Low Stock Items", value: stats.lowStockCount, icon: AlertTriangle, color: "text-red-600" },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wrench className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
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
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      {(isAdmin || isStorekeeper) && (
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/parts">
              <Package className="mr-1 h-4 w-4" /> Manage Parts
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/stock/in">
              <ArrowDownToLine className="mr-1 h-4 w-4" /> Stock In
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/jobs">
              <ClipboardList className="mr-1 h-4 w-4" /> Job Cards
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/users">
                <Package className="mr-1 h-4 w-4" /> Manage Users
              </Link>
            </Button>
          )}
        </div>
      )}

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
