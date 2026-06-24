import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { jobCardService } from "@/services/jobCardService"
import type { JobCardRequest } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, ArrowLeft, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import axios from "axios"

const DRAFT_KEY = "job-card-draft"

function loadDraft(): JobCardRequest | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveDraft(form: JobCardRequest) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  } catch { /* ignore */ }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

export function JobCardFormPage() {
  useDocumentTitle("New Job Card")
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [showRestore, setShowRestore] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<JobCardRequest>({
    customerName: "",
    customerPhone: "",
    vehicleRegistration: "",
    vehicleModel: "",
    requestedWork: "",
  })

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft && (draft.customerName || draft.requestedWork)) {
      setShowRestore(true)
    }
  }, [])

  const handleRestore = () => {
    const draft = loadDraft()
    if (draft) {
      setForm(draft)
      setShowRestore(false)
      toast.success("Draft restored")
    }
  }

  const handleDismissDraft = () => {
    clearDraft()
    setShowRestore(false)
  }

  const update = useCallback((field: keyof JobCardRequest, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      saveDraft(next)
      return next
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      await jobCardService.create(form)
      clearDraft()
      toast.success("Job card created")
      navigate("/jobs")
    } catch (err: unknown) {
      const knownFieldNames = ["customerName", "customerPhone", "vehicleRegistration", "vehicleModel", "requestedWork"];
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, string>;
        const hasFieldErrors = Object.keys(data).some((k) => knownFieldNames.includes(k));
        if (hasFieldErrors) {
          setErrors(data);
        } else if (data.message) {
          toast.error(data.message);
        } else {
          toast.error("Failed to create job card");
        }
      } else {
        toast.error("Failed to create job card");
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ label: "Job Cards", href: "/jobs" }, { label: "New Job Card" }]} />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Wrench className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">New Job Card</h1>
      </div>

      {showRestore && (
        <Card className="max-w-2xl border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="h-4 w-4 text-amber-600" />
              <span>You have a saved draft from a previous session.</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDismissDraft}>
                Dismiss
              </Button>
              <Button size="sm" onClick={handleRestore}>
                Restore Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Customer & Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input id="customerName" value={form.customerName}
                  onChange={(e) => { setErrors((prev) => ({ ...prev, customerName: "" })); update("customerName", e.target.value) }}
                  required className={errors.customerName ? "border-destructive" : ""}
                  placeholder="e.g., John Doe" />
                {errors.customerName && (
                  <p className="text-xs text-destructive">{errors.customerName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input id="customerPhone" value={form.customerPhone || ""}
                  onChange={(e) => update("customerPhone", e.target.value)}
                  placeholder="e.g., 0712 345 678" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleRegistration">Vehicle Registration</Label>
                <Input id="vehicleRegistration" value={form.vehicleRegistration || ""}
                  onChange={(e) => update("vehicleRegistration", e.target.value)}
                  placeholder="e.g., RAB 123A" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Vehicle Model</Label>
                <Input id="vehicleModel" value={form.vehicleModel || ""}
                  onChange={(e) => update("vehicleModel", e.target.value)}
                  placeholder="e.g., Toyota Hilux Revo" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedWork">Work Requested</Label>
              <Textarea id="requestedWork" value={form.requestedWork || ""}
                onChange={(e) => update("requestedWork", e.target.value)}
                placeholder="Describe the work the customer requested..."
                rows={4} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Job Card"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/jobs")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
