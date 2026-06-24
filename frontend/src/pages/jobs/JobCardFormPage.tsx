import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { jobCardService } from "@/services/jobCardService"
import type { JobCardRequest } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export function JobCardFormPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<JobCardRequest>({
    customerName: "",
    customerPhone: "",
    vehicleRegistration: "",
    vehicleModel: "",
    requestedWork: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await jobCardService.create(form)
      toast.success("Job card created")
      navigate("/jobs")
    } catch {
      toast.error("Failed to create job card")
    } finally {
      setSaving(false)
    }
  }

  const update = (field: keyof JobCardRequest, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Wrench className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">New Job Card</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer & Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input id="customerName" value={form.customerName}
                  onChange={(e) => update("customerName", e.target.value)} required
                  placeholder="e.g., John Doe" />
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
