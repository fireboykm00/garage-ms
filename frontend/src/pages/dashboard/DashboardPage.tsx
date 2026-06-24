import { useState, useEffect, useRef, startTransition } from "react"
import { dashboardService } from "@/services/dashboardService"
import { stockService } from "@/services/stockService"
import { partService } from "@/services/partService"
import type { DashboardStats, StockTransaction, JobCard, Part } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package, ArrowDownToLine, ClipboardList, PlayCircle, CheckCircle2,
  Plus, AlertTriangle, Wrench, Clock, RefreshCw, ArrowUpFromLine
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { timeSince } from "@/lib/utils"
import { toast } from "sonner"

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

function StatCard({ title, value, icon: Icon, href }: { title: string; value: number; icon: React.ElementType; href: string }) {
  return (
    <Link to={href}>
      <Card className="cursor-pointer transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-primary/70" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  )
}



export function DashboardPage() {
  const { isAdmin, isStorekeeper, isMechanic, isReceptionist } = useAuth()
  useDocumentTitle("Dashboard")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [recentJobs, setRecentJobs] = useState<JobCard[]>([])
  const [lowStockParts, setLowStockParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errors, setErrors] = useState({
    stats: false,
    transactions: false,
    jobs: false,
    lowStock: false,
  })

  const loadIdRef = useRef(0)

  const fetchData = (id: number) => {
    Promise.allSettled([
      dashboardService.getStats(),
      stockService.getTransactions(),
      dashboardService.getRecentJobs(),
      partService.getLowStock(),
    ]).then(([statsRes, txRes, jobsRes, lowRes]) => {
      if (id !== loadIdRef.current) return
      const newErrors = {
        stats: statsRes.status === "rejected",
        transactions: txRes.status === "rejected",
        jobs: jobsRes.status === "rejected",
        lowStock: lowRes.status === "rejected",
      }
      setErrors(newErrors)

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data)
      if (txRes.status === "fulfilled") setTransactions(txRes.value.data)
      if (jobsRes.status === "fulfilled") setRecentJobs(jobsRes.value.data)
      if (lowRes.status === "fulfilled") setLowStockParts(lowRes.value.data)

      const someFailed = Object.values(newErrors).some(Boolean)
      const allFailed = Object.values(newErrors).every(Boolean)
      setHasError(allFailed)

      if (someFailed && !allFailed) {
        toast.error("Some dashboard data failed to load")
      } else if (allFailed) {
        toast.error("Failed to load dashboard data")
      }
    }).finally(() => { if (id === loadIdRef.current) setLoading(false) })
  }

  useEffect(() => {
    const id = ++loadIdRef.current
    startTransition(() => {
      setLoading(true)
      setHasError(false)
      setErrors({ stats: false, transactions: false, jobs: false, lowStock: false })
    })
    fetchData(id)
  }, [])

  const inProgressJobs = recentJobs.filter((j) => j.status === "IN_PROGRESS")
  const canSeeInventory = isAdmin || isStorekeeper || isMechanic
  const canManageStock = isAdmin || isStorekeeper
  const canManageJobs = isAdmin || isStorekeeper || isReceptionist

  // Full error state
  if (hasError && !loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs segments={[{ label: "Dashboard" }]} />
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Unable to load dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Could not load any dashboard data. Please check your connection and try again.
            </p>
            <Button onClick={() => { const id = ++loadIdRef.current; setLoading(true); setHasError(false); fetchData(id) }}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ label: "Dashboard" }]} />
      <div className="flex items-center gap-2">
        <Wrench className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Stat cards row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
          : stats && (
            <>
              {canSeeInventory && (
                <StatCard title="Total Parts" value={stats.totalParts} icon={Package} href="/stocks" />
              )}
              {(isAdmin || isStorekeeper) && (
                <StatCard title="Stock In" value={stats.totalStockIn} icon={ArrowDownToLine} href="/stock/in" />
              )}
              {(isAdmin || isStorekeeper) && (
                <StatCard title="Stock Out" value={stats.totalStockOut} icon={ArrowUpFromLine} href="/reports/stock-out" />
              )}
              {canSeeInventory && stats.lowStockCount > 0 && (
                <StatCard title="Low Stock" value={stats.lowStockCount} icon={AlertTriangle} href="/stocks" />
              )}
            </>
          )}
      </div>

      {/* Jobs wrapper card */}
      {stats && (
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jobs</CardTitle>
            <Link to="/jobs"><ClipboardList className="h-4 w-4 text-primary/70 cursor-pointer hover:text-primary" /></Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Link to="/jobs" className="block">
                <Card className="cursor-pointer transition-shadow hover:shadow border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Open</span>
                      <ClipboardList className="h-3.5 w-3.5 text-primary/70" />
                    </div>
                    <div className="text-xl font-bold">{stats.openJobs}</div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/jobs" className="block">
                <Card className="cursor-pointer transition-shadow hover:shadow border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">In Progress</span>
                      <PlayCircle className="h-3.5 w-3.5 text-primary/70" />
                    </div>
                    <div className="text-xl font-bold">{stats.inProgressJobs}</div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/jobs" className="block">
                <Card className="cursor-pointer transition-shadow hover:shadow border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Completed Today</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary/70" />
                    </div>
                    <div className="text-xl font-bold">{stats.completedToday}</div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {canManageJobs && (
          <Button asChild>
            <Link to="/jobs/new">
              <Plus className="mr-1 h-4 w-4" /> New Job Card
            </Link>
          </Button>
        )}
        {canManageStock && (
          <Button asChild variant="outline">
            <Link to="/stock/in">
              <ArrowDownToLine className="mr-1 h-4 w-4" /> Stock In
            </Link>
          </Button>
        )}
        {(isAdmin || isStorekeeper) && (
          <Button asChild variant="outline">
            <Link to="/reports/stock-out">
              <ArrowUpFromLine className="mr-1 h-4 w-4" /> Stock Out
            </Link>
          </Button>
        )}
        {canManageStock && (
          <Button asChild variant="outline">
            <Link to="/stocks">
              <Package className="mr-1 h-4 w-4" /> Add Part
            </Link>
          </Button>
        )}
      </div>

      {/* Low stock + In Progress row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low stock alerts - only for inventory roles */}
        {canSeeInventory && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Low Stock Items
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
              ) : errors.lowStock ? (
                <p className="text-sm text-muted-foreground">Failed to load low stock data.</p>
              ) : lowStockParts.length === 0 ? (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  All items are well-stocked
                </p>
              ) : (
                <div className="space-y-2">
                  {lowStockParts.slice(0, 5).map((part) => (
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
                        {canManageStock && (
                          <Button asChild variant="outline" size="sm">
                            <Link to={part.id ? `/stock/in?partId=${part.id}` : "/stock/in"}>
                              <ArrowDownToLine className="h-3 w-3" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
            ) : errors.jobs ? (
              <p className="text-sm text-muted-foreground">Failed to load jobs data.</p>
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
            ) : errors.jobs ? (
              <p className="text-sm text-muted-foreground">Failed to load jobs data.</p>
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
                    <span className={`text-xs font-medium ${
                      job.status === "OPEN" ? "text-blue-600" :
                      job.status === "IN_PROGRESS" ? "text-amber-600" :
                      job.status === "COMPLETED" ? "text-green-600" :
                      "text-red-600"
                    }`}>
                      {statusLabel[job.status] || job.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {(isAdmin || isStorekeeper) && (
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
              ) : errors.transactions ? (
                <p className="text-sm text-muted-foreground">Failed to load transactions data.</p>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">PART</th>
                        <th className="pb-2 font-medium">TYPE</th>
                        <th className="pb-2 font-medium">QTY</th>
                        <th className="pb-2 font-medium">BY</th>
                        <th className="pb-2 font-medium">DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b last:border-0">
                          <td className="py-2">{tx.partName}</td>
                          <td className="py-2">
                            <span className={`text-xs font-medium ${
                              tx.type === "IN" ? "text-green-600" : "text-red-600"
                            }`}>
                              {tx.type}
                            </span>
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
        )}
      </div>
    </div>
  )
}
