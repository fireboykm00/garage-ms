import { useState, useEffect, useMemo } from "react"
import { partService } from "@/services/partService"
import { stockService } from "@/services/stockService"
import type { Part, StockInRequest } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowDownToLine, Search } from "lucide-react"
import { toast } from "sonner"

export function StockInPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [partSearch, setPartSearch] = useState("")
  const [form, setForm] = useState<StockInRequest>({ partId: 0, quantity: 1, note: "" })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.partId) { toast.error("Select a part"); return }
    setSaving(true)
    try {
      await stockService.stockIn(form)
      toast.success("Stock in recorded")
      setForm({ partId: 0, quantity: 1, note: "" })
    } catch {
      toast.error("Failed to record stock in")
    } finally {
      setSaving(false)
    }
  }

  const selectedPart = parts.find((p) => p.id === form.partId)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <ArrowDownToLine className="h-6 w-6 text-green-600" />
        <h1 className="text-2xl font-bold tracking-tight">Stock In</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record parts coming into stock</CardTitle>
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
                Current stock: <strong>{selectedPart.currentQuantity}</strong> {selectedPart.unit}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Add</Label>
              <Input id="quantity" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Supplier name, reason, etc." />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Recording..." : "Record Stock In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
