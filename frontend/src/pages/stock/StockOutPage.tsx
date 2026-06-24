import { useState, useEffect, useMemo } from "react"
import { partService } from "@/services/partService"
import { stockService } from "@/services/stockService"
import type { Part, StockOutRequest } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUpFromLine, AlertTriangle, Search } from "lucide-react"
import { toast } from "sonner"

export function StockOutPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [partSearch, setPartSearch] = useState("")
  const [form, setForm] = useState<StockOutRequest>({ partId: 0, quantity: 1, note: "" })
  const [saving, setSaving] = useState(false)

  const filteredParts = useMemo(() => {
    if (!partSearch.trim()) return parts
    const q = partSearch.toLowerCase()
    return parts.filter(
      (p) =>
        p.partNumber.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.model || "").toLowerCase().includes(q) ||
        (p.warehouse || "").toLowerCase().includes(q)
    )
  }, [parts, partSearch])

  useEffect(() => {
    partService.getAll().then((res) => setParts(res.data)).catch(() => toast.error("Failed to load parts"))
  }, [])

  const selectedPart = parts.find((p) => p.id === form.partId)
  const exceedsStock = selectedPart && form.quantity > selectedPart.currentQuantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.partId) { toast.error("Select a part"); return }
    if (exceedsStock) { toast.error("Quantity exceeds available stock"); return }
    setSaving(true)
    try {
      await stockService.stockOut(form)
      toast.success("Stock out recorded")
      setForm({ partId: 0, quantity: 1, note: "" })
    } catch {
      toast.error("Failed to record stock out")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <ArrowUpFromLine className="h-6 w-6 text-orange-600" />
        <h1 className="text-2xl font-bold tracking-tight">Stock Out</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record parts leaving stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Part</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search parts..."
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                />
              </div>
              <Select value={form.partId ? String(form.partId) : ""} onValueChange={(v) => setForm({ ...form, partId: Number(v) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a part" />
                </SelectTrigger>
                <SelectContent>
                  {filteredParts.map((part) => (
                    <SelectItem key={part.id} value={String(part.id)}>
                      {part.partNumber} - {part.name} ({part.currentQuantity} {part.unit}){part.warehouse ? ` [${part.warehouse}]` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPart && (
              <p className="text-sm text-muted-foreground">
                Available stock: <strong>{selectedPart.currentQuantity}</strong> {selectedPart.unit}
              </p>
            )}

            {exceedsStock && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Insufficient stock! Available: {selectedPart?.currentQuantity} {selectedPart?.unit}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Remove</Label>
              <Input id="quantity" type="number" min="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Reason for removal, destination, etc." />
            </div>

            <Button type="submit" className="w-full" disabled={saving || !!exceedsStock}>
              {saving ? "Recording..." : "Record Stock Out"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
