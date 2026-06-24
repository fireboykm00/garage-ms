import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
import { Wrench, ArrowLeft, Plus, FileDown, XCircle } from "lucide-react"
import { toast } from "sonner"
import { generateJobCardPDF } from "@/lib/generateJobCardPDF"

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

export function JobCardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin, isStorekeeper, isMechanic } = useAuth()
  const [job, setJob] = useState<JobCard | null>(null)
  const [parts, setParts] = useState<JobCardPart[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Wrench className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">{job.jobNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Created by {job.createdByName} on {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant[job.status]} className="text-sm px-3 py-1">
          {statusLabel[job.status]}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {job.customerName}</p>
            {job.customerPhone && <p><span className="text-muted-foreground">Phone:</span> {job.customerPhone}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Vehicle</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {job.vehicleRegistration
              ? <p><span className="text-muted-foreground">Reg:</span> {job.vehicleRegistration}</p>
              : <p className="text-muted-foreground">No vehicle recorded</p>}
            {job.vehicleModel && <p><span className="text-muted-foreground">Model:</span> {job.vehicleModel}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Work Requested</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{job.requestedWork || "Not specified"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Technical Report</CardTitle>
          {canEdit && (
            <EditTextButton
              value={job.technicalReport || ""}
              onSave={async (v) => {
                const res = await jobCardService.updateTechnicalReport(job.id, v)
                setJob(res.data)
                toast.success("Technical report updated")
              }}
              label="Edit Report"
            />
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{job.technicalReport || "No report yet"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Work Completed</CardTitle>
          {canEdit && (
            <EditTextButton
              value={job.workCompleted || ""}
              onSave={async (v) => {
                const res = await jobCardService.updateWorkCompleted(job.id, v)
                setJob(res.data)
                toast.success("Work completed updated")
              }}
              label="Edit"
            />
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{job.workCompleted || "Not yet completed"}</p>
        </CardContent>
      </Card>

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
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{p.partNumber}</td>
                      <td className="py-2">{p.partName}</td>
                      <td className="py-2">{p.quantity}</td>
                      <td className="py-2">{p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex flex-wrap gap-3">
          {job.status === "OPEN" && (
            <Button onClick={() => updateStatus("IN_PROGRESS")}>
              Start Work
            </Button>
          )}
          {job.status === "IN_PROGRESS" && (
            <Button onClick={() => updateStatus("COMPLETED")}>
              Mark Completed
            </Button>
          )}
          {job.status === "COMPLETED" && isAdmin && (
            <Button variant="outline" onClick={() => updateStatus("OPEN")}>
              Reopen
            </Button>
          )}
          {(job.status === "OPEN" || job.status === "IN_PROGRESS") && (isAdmin || isStorekeeper) && (
            <Button variant="destructive" onClick={() => updateStatus("CANCELLED")}>
              <XCircle className="mr-1 h-4 w-4" /> Cancel Job
            </Button>
          )}
          {job.status === "CANCELLED" && isAdmin && (
            <Button variant="outline" onClick={() => updateStatus("OPEN")}>
              Reopen
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => generateJobCardPDF(job, parts)}>
          <FileDown className="mr-1 h-4 w-4" /> Download PDF
        </Button>
      </div>
    </div>
  )
}

function EditTextButton({ value, onSave, label }: { value: string; onSave: (v: string) => Promise<void>; label: string }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)

  if (!editing) {
    return (
      <Button variant="ghost" size="sm" onClick={() => { setText(value); setEditing(true) }}>
        {label}
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="min-w-[300px]" />
      <div className="flex flex-col gap-1">
        <Button size="sm" onClick={async () => { await onSave(text); setEditing(false) }}>Save</Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
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
