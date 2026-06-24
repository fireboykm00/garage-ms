import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { jobCardService } from "@/services/jobCardService"
import { partService } from "@/services/partService"
import { useAuth } from "@/hooks/useAuth"
import type { JobCard, JobCardPart, JobCardStatus, Part } from "@/types"
import { Button } from "@/components/ui/button"
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
  ExternalLink, Trash2
} from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { generateJobCardPDF } from "@/lib/generateJobCardPDF"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { normalizeError } from "@/lib/errors"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

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
  const [removingPartId, setRemovingPartId] = useState<number | null>(null)

  // Add Part form state
  const [showAddPartForm, setShowAddPartForm] = useState(false)
  const [addPartParts, setAddPartParts] = useState<Part[]>([])
  const [addPartPartsLoading, setAddPartPartsLoading] = useState(false)
  const [addPartSearch, setAddPartSearch] = useState("")
  const [addPartSelectedId, setAddPartSelectedId] = useState("")
  const [addPartQuantity, setAddPartQuantity] = useState(1)

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
          }).catch(() => console.error("Failed to load previous jobs"))
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

  const handleRemovePart = async (jobCardPartId: number) => {
    if (!id) return
    setRemovingPartId(jobCardPartId)
    try {
      await jobCardService.removePart(Number(id), jobCardPartId)
      toast.success("Part removed from job card")
      setParts((prev) => prev.filter((p) => p.id !== jobCardPartId))
    } catch (err: unknown) {
      console.error("Remove part error:", err)
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(normalizeError(err).message)
      }
    } finally {
      setRemovingPartId(null)
    }
  }

  const loadAddPartParts = useCallback(async () => {
    setAddPartPartsLoading(true)
    try {
      const res = await partService.getAll()
      setAddPartParts(res.data)
    } catch {
      toast.error("Failed to load parts")
    } finally {
      setAddPartPartsLoading(false)
    }
  }, [])

  const addPartFiltered = addPartParts.filter((p) => {
    if (!addPartSearch.trim()) return true
    const q = addPartSearch.toLowerCase()
    return p.partNumber.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  })

  const addPartSelected = addPartParts.find((p) => p.id === Number(addPartSelectedId))
  const addPartExceedsStock = addPartSelected && addPartQuantity > addPartSelected.currentQuantity

  const handleAddPart = async () => {
    if (!id || !addPartSelectedId || !addPartQuantity || addPartExceedsStock) return
    try {
      const res = await jobCardService.addPart(Number(id), { partId: Number(addPartSelectedId), quantity: addPartQuantity })
      const p = res.data
      setParts((prev) => {
        const existing = prev.find((ep) => ep.partId === p.partId)
        if (existing) return prev.map((ep) => (ep.partId === p.partId ? p : ep))
        return [...prev, p]
      })
      toast.success(`${p.quantity}x ${p.partName} added — will be consumed on completion`)
      setAddPartSelectedId(""); setAddPartQuantity(1); setAddPartSearch(""); setShowAddPartForm(false)
    } catch (err) {
      const { message } = normalizeError(err)
      toast.error(message)
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
          <span className={`text-sm font-semibold ${
            job.status === "OPEN" ? "text-blue-600" :
            job.status === "IN_PROGRESS" ? "text-amber-600" :
            job.status === "COMPLETED" ? "text-green-600" :
            "text-red-600"
          }`}>
            {statusLabel[job.status]}
          </span>
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
                editable={canEdit && isActive}
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
                editable={canEdit && isActive}
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
                <Button variant="outline" size="sm" onClick={() => { setShowAddPartForm(true); loadAddPartParts() }}>
                  <Plus className="mr-1 h-3 w-3" /> Add Part
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {parts.length === 0 && !showAddPartForm ? (
                <p className="text-sm text-muted-foreground">No parts used yet.</p>
              ) : (
                <>
                  {parts.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">PART NUMBER</th>
                            <th className="pb-2 font-medium">DESCRIPTION</th>
                            <th className="pb-2 font-medium">QTY</th>
                            <th className="pb-2 font-medium">UNIT</th>
                            <th className="pb-2 font-medium">EST. COST</th>
                            {canEdit && isActive && (
                              <th className="pb-2 font-medium text-right">ACTIONS</th>
                            )}
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
                              {canEdit && isActive && (
                                <td className="px-4 py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Remove part">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove part?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {p.quantity}x {p.partName} ({p.partNumber}) will be removed from the job card.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleRemovePart(p.id)} disabled={removingPartId === p.id}>
                                            {removingPartId === p.id ? "Removing..." : "Remove"}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Inline Add Part form */}
                  {showAddPartForm && (
                    <div className="mt-4 space-y-3 rounded-lg border p-4">
                      <div className="space-y-2">
                        <Label>Search Part</Label>
                        <Input placeholder="Type part number or name..." value={addPartSearch} onChange={(e) => setAddPartSearch(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Select Part</Label>
                        <Select value={addPartSelectedId} onValueChange={setAddPartSelectedId} disabled={addPartPartsLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder={addPartPartsLoading ? "Loading parts..." : "Choose a part"} />
                          </SelectTrigger>
                          <SelectContent>
                            {addPartPartsLoading ? (
                              <div className="px-2 py-4 text-center text-sm text-muted-foreground">Loading parts...</div>
                            ) : addPartFiltered.length === 0 ? (
                              <div className="px-2 py-4 text-center text-sm text-muted-foreground">No parts found</div>
                            ) : (
                              addPartFiltered.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  {p.partNumber} — {p.name} ({p.currentQuantity} {p.unit})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {addPartSelected && (
                        <p className="text-xs text-muted-foreground">
                          Balance: <strong>{addPartSelected.currentQuantity}</strong> {addPartSelected.unit}
                        </p>
                      )}
                      {addPartExceedsStock && (
                        <p className="text-xs text-destructive">Not enough stock! Available: {addPartSelected?.currentQuantity}</p>
                      )}
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input type="number" min="1" value={addPartQuantity} onChange={(e) => setAddPartQuantity(parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={!addPartSelectedId || !addPartQuantity || !!addPartExceedsStock} onClick={handleAddPart}>
                          Add to Job Card
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setShowAddPartForm(false); setAddPartSelectedId(""); setAddPartQuantity(1); setAddPartSearch("") }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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
