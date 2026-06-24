import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { jobCardService } from "@/services/jobCardService"
import { useAuth } from "@/contexts/AuthContext"
import type { JobCard } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, Search, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  OPEN: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
}

export function JobCardListPage() {
  const { isAdmin, isStorekeeper, isReceptionist } = useAuth()
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const canCreate = isAdmin || isStorekeeper || isReceptionist

  useEffect(() => {
    jobCardService.getAll()
      .then((res) => setJobs(res.data))
      .catch(() => toast.error("Failed to load job cards"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs
    const q = search.toLowerCase()
    return jobs.filter(
      (j) =>
        j.jobNumber.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        (j.vehicleRegistration || "").toLowerCase().includes(q) ||
        (j.vehicleModel || "").toLowerCase().includes(q)
    )
  }, [jobs, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Job Cards</h1>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/jobs/new">
              <Plus className="mr-1 h-4 w-4" /> New Job Card
            </Link>
          </Button>
        )}
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

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`}>
              <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-mono">{job.jobNumber}</CardTitle>
                    <Badge variant={statusVariant[job.status]}>{job.status.replace("_", " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Customer:</span> {job.customerName}</p>
                  {job.vehicleRegistration && (
                    <p><span className="text-muted-foreground">Vehicle:</span> {job.vehicleRegistration} {job.vehicleModel ? `(${job.vehicleModel})` : ""}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
