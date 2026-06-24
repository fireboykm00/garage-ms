import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { jobCardService } from "@/services/jobCardService"
import { useAuth } from "@/hooks/useAuth"
import type { JobCard, JobCardStatus } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Wrench, Search, Plus, List, Columns3,
  Clock
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

type ViewMode = "list" | "kanban"
type StatusFilter = "ALL" | JobCardStatus

const statusTabs: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
]

const statusConfig: Record<JobCardStatus, { label: string; color: string; bg: string; border: string }> = {
  OPEN: { label: "Open", color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" },
  COMPLETED: { label: "Completed", color: "text-green-700", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
}

const kolommen: JobCardStatus[] = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

export function JobCardListPage() {
  useDocumentTitle("Job Cards")
  const { isAdmin, isStorekeeper, isReceptionist } = useAuth()
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")

  const canCreate = isAdmin || isStorekeeper || isReceptionist

  useEffect(() => {
    jobCardService.getAll()
      .then((res) => setJobs(res.data))
      .catch(() => toast.error("Failed to load job cards"))
      .finally(() => setLoading(false))
  }, [])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: jobs.length }
    for (const s of kolommen) {
      counts[s] = jobs.filter((j) => j.status === s).length
    }
    return counts
  }, [jobs])

  const filtered = useMemo(() => {
    let result = jobs
    if (statusFilter !== "ALL") {
      result = result.filter((j) => j.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (j) =>
          j.jobNumber.toLowerCase().includes(q) ||
          j.customerName.toLowerCase().includes(q) ||
          (j.vehicleRegistration || "").toLowerCase().includes(q) ||
          (j.vehicleModel || "").toLowerCase().includes(q)
      )
    }
    return result
  }, [jobs, search, statusFilter])

  const kanbanData = useMemo(() => {
    const data: Record<JobCardStatus, JobCard[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      CANCELLED: [],
    }
    for (const job of filtered) {
      if (data[job.status]) data[job.status].push(job)
    }
    return data
  }, [filtered])

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ label: "Job Cards" }]} />

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Job Cards</h1>
          </div>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => { if (v) setViewMode(v as ViewMode) }}
            >
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="kanban" aria-label="Kanban view">
                <Columns3 className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            {canCreate && (
              <Button asChild>
                <Link to="/jobs/new">
                  <Plus className="mr-1 h-4 w-4" /> New Job Card
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by job number, customer, or vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {tab.label} ({statusCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        viewMode === "list" ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-24" />
                {Array.from({ length: 2 }).map((_, j) => <Skeleton key={j} className="h-28 w-full" />)}
              </div>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No job cards found.</p>
            {canCreate && (
              <Button asChild className="mt-4">
                <Link to="/jobs/new">Create First Job Card</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kolommen.map((status) => (
            <div key={status} className="space-y-3">
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${statusConfig[status].bg} ${statusConfig[status].border} border`}>
                <span className={`text-sm font-semibold ${statusConfig[status].color}`}>
                  {statusConfig[status].label}
                </span>
                <Badge variant="outline" className="text-xs">
                  {kanbanData[status].length}
                </Badge>
              </div>
              {kanbanData[status].length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">No cards</p>
              ) : (
                <div className="space-y-2">
                  {kanbanData[status].map((job) => (
                    <Link key={job.id} to={`/jobs/${job.id}`}>
                      <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
                        <CardHeader className="pb-1 px-3 pt-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-xs font-mono">{job.jobNumber}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="space-y-0.5 text-xs">
                            <p className="font-medium truncate">{job.customerName}</p>
                            {job.vehicleRegistration && (
                              <p className="text-muted-foreground truncate">{job.vehicleRegistration}</p>
                            )}
                            {job.requestedWork && (
                              <p className="text-muted-foreground truncate">{job.requestedWork}</p>
                            )}
                            <p className="text-muted-foreground text-[10px]">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`}>
              <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base font-mono">{job.jobNumber}</CardTitle>
                        <span className={`text-xs font-medium ${statusConfig[job.status].color}`}>
                          {statusConfig[job.status].label}
                        </span>
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span><span className="text-muted-foreground">Customer:</span> {job.customerName}</span>
                    {job.vehicleRegistration && (
                      <span><span className="text-muted-foreground">Vehicle:</span> {job.vehicleRegistration}{job.vehicleModel ? ` (${job.vehicleModel})` : ""}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      <Clock className="mr-0.5 inline h-3 w-3" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {job.requestedWork && (
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">{job.requestedWork}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
