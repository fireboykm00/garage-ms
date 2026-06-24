import { useState, useEffect, useMemo } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { jobCardService } from "@/services/jobCardService"
import { partService } from "@/services/partService"
import { useAuth } from "@/contexts/AuthContext"
import type { JobCard, JobCardPart, JobCardStatus, Part } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft, Plus, FileDown, XCircle,
  Settings, Wrench, Package, Printer, Clock, User, Truck,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import { generateJobCardPDF } from "@/lib/generateJobCardPDF"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  OPEN: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
}

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

interface TimelineEvent {
  id: string
  type: "created" | "status" | "part_added" | "report" | "work_completed"
  icon: string
  title: string
  description: string
  timestamp: string
  user?: string
}

export function JobCardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin, isStorekeeper, isMechanic } = useAuth()
  const [job, setJob] = useState<JobCard | null>(null)
  const [parts, setParts] = useState<JobCardPart[]>([])
  useDocumentTitle(job ? job.jobNumber : "Job Card Detail")
  const [loading, setLoading] = useState(true)
  const [previousJobs, setPreviousJobs] = useState<JobCard[]>([])

  const canEdit = isAdmin || isStorekeeper || isMechanic
  const isActive = job?.status === "OPEN" || job?.status === "IN_PROGRESS"

  useEffect(() => {
    if (!id) return
    Promise.all([
      jobCardService.getById(Number(id)),
      jobCardService.getParts(Number(id)),
    ])
      .then(([jobRes, partsRes]) => {
        setJob(jobRes.data)
        setParts(partsRes.data)
        // Load previous jobs for same vehicle/customer (Phase 7.2)
        const j = jobRes.data
        const params: string[] = []
        if (j.vehicleRegistration) params.push(`vehicleRegistration=${encodeURIComponent(j.vehicleRegistration)}`)
        if (j.customerPhone) params.push(`customerPhone=${encodeURIComponent(j.customerPhone)}`)
        if (params.length > 0) {
          jobCardService.getAll().then((res) => {
            const all = res.data
            const prev = all.filter(
              (jc) => jc.id !== j.id && (
                (j.vehicleRegistration && jc.vehicleRegistration === j.vehicleRegistration) ||
                (j.customerPhone && jc.customerPhone === j.customerPhone)
              )
            ).slice(0, 5)
            setPreviousJobs(prev)
          }).catch(() => {})
        }
      })
      .catch(() => toast.error("Failed to load job card"))
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (status: JobCardStatus) => {
    try {
      const res = await jobCardService.updateStatus(job!.id, status)
      setJob(res.data)
      toast.success(`Status → ${statusLabel[status]}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!job) return []
    const events: TimelineEvent[] = []

    // Creation event
    events.push({
      id: "created",
      type: "created",
      icon: "📅",
      title: "Job Card Created",
      description: `Job ${job.jobNumber} was created`,
      timestamp: job.createdAt,
      user: job.createdByName,
    })

    // Part added events (from parts data)
    parts.forEach((p) => {
      events.push({
        id: `part-${p.id}`,
        type: "part_added",
        icon: "➕",
        title: "Part Added",
        description: `${p.quantity}x ${p.partName} (${p.partNumber}) added to job`,
        timestamp: p.createdAt || job.updatedAt,
      })
    })

    // Status changes (inferred from updatedAt)
    if (job.status === "IN_PROGRESS" || job.status === "COMPLETED" || job.status === "CANCELLED") {
      events.push({
        id: "status-in_progress",
        type: "status",
        icon: "🔧",
        title: "Work Started",
        description: "Job status changed to In Progress",
        timestamp: job.updatedAt,
      })
    }
    if (job.status === "COMPLETED") {
      events.push({
        id: "status-completed",
        type: "status",
        icon: "✅",
        title: "Work Completed",
        description: "Job marked as completed",
        timestamp: job.updatedAt,
      })
    }
    if (job.status === "CANCELLED") {
      events.push({
        id: "status-cancelled",
        type: "status",
        icon: "❌",
        title: "Job Cancelled",
        description: "Job was cancelled",
        timestamp: job.updatedAt,
      })
    }

    // Technical report events
    if (job.technicalReport) {
      events.push({
        id: "report",
        type: "report",
        icon: "📝",
        title: "Technical Report Updated",
        description: "Technical report was updated",
        timestamp: job.updatedAt,
      })
    }

    // Work completed text
    if (job.workCompleted) {
      events.push({
        id: "work-done",
        type: "work_completed",
        icon: "🔧",
        title: "Work Description Updated",
        description: "Work completed details were updated",
        timestamp: job.updatedAt,
      })
    }

    // Sort by timestamp ascending
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    return events
  }, [job, parts])

  const handleUpdateTechnicalReport = async (report: string) => {
    if (!job) return
    try {
      const res = await jobCardService.updateTechnicalReport(job.id, report)
      setJob(res.data)
      toast.success("Technical report updated")
    } catch {
      toast.error("Failed to update technical report")
    }
  }

  const handleUpdateWorkCompleted = async (work: string) => {
    if (!job) return
    try {
      const res = await jobCardService.updateWorkCompleted(job.id, work)
      setJob(res.data)
      toast.success("Work completed updated")
    } catch {
      toast.error("Failed to update work completed")
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-muted-foreground">Job card not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumbs segments={[{ label: "Job Cards", href: "/jobs" }, { label: job.jobNumber }]} />
      {/* Sticky status bar */}
      <div className="sticky top-0 z-20 -mx-4 rounded-lg border bg-background/95 backdrop-blur px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-mono font-bold text-lg">{job.jobNumber}</span>
          <Badge variant={statusVariant[job.status]} className="text-sm px-3 py-1">
            {statusLabel[job.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && job.status === "OPEN" && (
            <Button size="sm" onClick={() => updateStatus("IN_PROGRESS")}>
              <Wrench className="mr-1 h-4 w-4" /> Start Work
            </Button>
          )}
          {canEdit && job.status === "IN_PROGRESS" && (
            <Button size="sm" variant="default" onClick={() => updateStatus("COMPLETED")}>
              <Package className="mr-1 h-4 w-4" /> Mark Completed
            </Button>
          )}
          {(job.status === "OPEN" || job.status === "IN_PROGRESS") && (isAdmin || isStorekeeper) && (
            <Button size="sm" variant="destructive" onClick={() => updateStatus("CANCELLED")}>
              <XCircle className="mr-1 h-4 w-4" /> Cancel
            </Button>
          )}
          {job.status === "COMPLETED" && isAdmin && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("OPEN")}>
              Reopen
            </Button>
          )}
          {job.status === "CANCELLED" && isAdmin && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("OPEN")}>
              Reopen
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => generateJobCardPDF(job, parts)}>
            <FileDown className="mr-1 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2">Details</TabsTrigger>
          <TabsTrigger value="parts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2">Parts</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2">Timeline</TabsTrigger>
          <TabsTrigger value="print" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2">Print</TabsTrigger>
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-muted/30 border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {job.customerName}</p>
                {job.customerPhone && <p><span className="text-muted-foreground">Phone:</span> {job.customerPhone}</p>}
                {previousJobs.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Previous jobs for this customer:</p>
                    {previousJobs.filter((j) => j.customerPhone === job.customerPhone).slice(0, 3).map((pj) => (
                      <Link key={pj.id} to={`/jobs/${pj.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> {pj.jobNumber} — {pj.vehicleRegistration || "N/A"}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {job.vehicleRegistration
                  ? <p><span className="text-muted-foreground">Reg:</span> {job.vehicleRegistration}</p>
                  : <p className="text-muted-foreground">No vehicle recorded</p>}
                {job.vehicleModel && <p><span className="text-muted-foreground">Model:</span> {job.vehicleModel}</p>}
                {previousJobs.filter((j) => j.vehicleRegistration === job.vehicleRegistration).length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Previous jobs for this vehicle:</p>
                    {previousJobs.filter((j) => j.vehicleRegistration === job.vehicleRegistration).slice(0, 3).map((pj) => (
                      <Link key={pj.id} to={`/jobs/${pj.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> {pj.jobNumber}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Work Requested</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{job.requestedWork || "Not specified"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Technical Report</CardTitle>
            </CardHeader>
            <CardContent>
              <EditableField
                value={job.technicalReport || ""}
                onSave={handleUpdateTechnicalReport}
                editable={canEdit}
                placeholder="No report yet"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Work Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <EditableField
                value={job.workCompleted || ""}
                onSave={handleUpdateWorkCompleted}
                editable={canEdit}
                placeholder="Not yet completed"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PARTS TAB */}
        <TabsContent value="parts" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Parts Used</CardTitle>
              {canEdit && isActive && (
                <AddPartButton
                  jobId={job.id}
                  onPartAdded={(p) => {
                    setParts((prev) => [...prev, p])
                    toast.success(`${p.quantity}x ${p.partName} added — stock deducted automatically`)
                  }}
                />
              )}
            </CardHeader>
            <CardContent>
              {parts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parts used yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Part Number</th>
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 font-medium">Qty</th>
                        <th className="pb-2 font-medium">Unit</th>
                        <th className="pb-2 font-medium">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-2 font-mono text-xs">{p.partNumber}</td>
                          <td className="py-2">{p.partName}</td>
                          <td className="py-2">{p.quantity}</td>
                          <td className="py-2">{p.unit || "-"}</td>
                          <td className="py-2 text-muted-foreground">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIMELINE TAB */}
        <TabsContent value="timeline" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events recorded yet.</p>
              ) : (
                <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-border">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border text-xs">
                        {event.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <Clock className="inline h-3 w-3 mr-0.5" />
                          {new Date(event.timestamp).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                          {event.user && ` by ${event.user}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRINT TAB */}
        <TabsContent value="print" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Print / Download</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download the job card as a PDF document. The PDF includes all job details,
                customer and vehicle information, work descriptions, and parts used.
              </p>
              <div className="rounded-lg border bg-muted/30 p-6 text-center">
                <Printer className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Job Card PDF Preview</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {job.jobNumber} · {statusLabel[job.status]} · {parts.length} part(s)
                </p>
                <Button onClick={() => generateJobCardPDF(job, parts)}>
                  <FileDown className="mr-1 h-4 w-4" /> Download Job Card PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EditableField({ value, onSave, editable, placeholder }: {
  value: string
  onSave: (v: string) => Promise<void>
  editable: boolean
  placeholder: string
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)

  if (!editing) {
    return (
      <div>
        <p className="text-sm whitespace-pre-wrap">{value || placeholder}</p>
        {editable && (
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => { setText(value); setEditing(true) }}>
            <Settings className="mr-1 h-3 w-3" /> Edit
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
      <div className="flex gap-2">
        <Button size="sm" onClick={async () => { await onSave(text); setEditing(false) }}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function AddPartButton({ jobId, onPartAdded }: { jobId: number; onPartAdded: (p: JobCardPart) => void }) {
  const [open, setOpen] = useState(false)
  const [parts, setParts] = useState<Part[]>([])
  const [selectedPartId, setSelectedPartId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (open) {
      partService.getAll().then((res) => setParts(res.data)).catch(() => toast.error("Failed to load parts"))
    }
  }, [open])

  const filtered = parts.filter((p) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return p.partNumber.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  })

  const selected = parts.find((p) => p.id === Number(selectedPartId))
  const exceedsStock = selected && quantity > selected.currentQuantity

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3 w-3" /> Add Part
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>Search Part</Label>
        <Input placeholder="Type part number or name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Select Part</Label>
        <Select value={selectedPartId} onValueChange={setSelectedPartId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a part" />
          </SelectTrigger>
          <SelectContent>
            {filtered.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.partNumber} — {p.name} ({p.currentQuantity} {p.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selected && (
        <p className="text-xs text-muted-foreground">
          In stock: <strong>{selected.currentQuantity}</strong> {selected.unit}
          {selected.warehouse ? ` [${selected.warehouse}]` : ""}
        </p>
      )}
      {exceedsStock && (
        <p className="text-xs text-destructive">Not enough stock! Available: {selected?.currentQuantity}</p>
      )}
      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={!selectedPartId || !quantity || !!exceedsStock}
          onClick={async () => {
            try {
              const res = await jobCardService.addPart(jobId, { partId: Number(selectedPartId), quantity })
              onPartAdded(res.data)
              setSelectedPartId(""); setQuantity(1); setSearch(""); setOpen(false)
            } catch { toast.error("Failed to add part") }
          }}>
          Add to Job Card
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}
