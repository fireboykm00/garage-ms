import { useState, useEffect, useMemo, useRef } from "react"
import { partService } from "@/services/partService"
import { stockService } from "@/services/stockService"
import type { Part, StockInRequest, StockTransaction } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowDownToLine, Plus, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

const QUICK_PRESETS = [1, 5, 10, 25, 50]

export function StockInPage() {
  useDocumentTitle("Stock In")
  const [parts, setParts] = useState<Part[]>([])
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([])
  const [partSearch, setPartSearch] = useState("")
  const [form, setForm] = useState<StockInRequest>({ partId: 0, quantity: 1, note: "" })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [successFlash, setSuccessFlash] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

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
    Promise.all([
      partService.getAll(),
      stockService.getTransactions(),
    ])
      .then(([partsRes, txRes]) => {
        setParts(partsRes.data)
        setRecentTransactions(
          txRes.data
            .filter((t) => t.type === "IN")
            .slice(0, 10)
        )
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.partId) { toast.error("Select a part"); return }
    setSaving(true)
    try {
      const res = await stockService.stockIn(form)
      const selectedPart = parts.find((p) => p.id === form.partId)
      const msg = `✓ ${form.quantity}x ${selectedPart?.name || "part"} added to stock`
      toast.success(msg, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await stockService.undoTransaction(res.data.id)
              toast.success("Stock in undone")
              const partsRes = await partService.getAll()
              setParts(partsRes.data)
            } catch {
              toast.error("Failed to undo")
            }
          },
        },
      })
      setSuccessFlash(true)
      setTimeout(() => setSuccessFlash(false), 1500)
      setForm({ partId: 0, quantity: 1, note: "" })
      setPartSearch("")
      // Refresh transactions
      const txRes = await stockService.getTransactions()
      setRecentTransactions(txRes.data.filter((t) => t.type === "IN").slice(0, 10))
      const partsRes = await partService.getAll()
      setParts(partsRes.data)
    } catch {
      toast.error("Failed to record stock in")
    } finally {
      setSaving(false)
    }
  }

  const selectedPart = parts.find((p) => p.id === form.partId)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Card><CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </CardContent></Card>
          <Card><CardContent className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </CardContent></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ label: "Stock In" }]} />

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold tracking-tight">Stock In</h1>
        </div>
      </div>

      <div
        ref={formRef}
        className={cn(
          "grid gap-6 lg:grid-cols-[3fr_2fr] transition-colors duration-500",
          successFlash && "bg-green-50 dark:bg-green-950/20 rounded-lg p-4 -m-4"
        )}
      >
        {/* Left: Form */}
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
                <Select
                  value={form.partId ? String(form.partId) : ""}
                  onValueChange={(v) => setForm({ ...form, partId: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a part" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredParts.length === 0 && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No parts found
                      </div>
                    )}
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
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {QUICK_PRESETS.map((q) => (
                    <Button
                      key={q}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn("h-7 px-2 text-xs", form.quantity === q && "bg-primary text-primary-foreground")}
                      onClick={() => setForm({ ...form, quantity: q })}
                    >
                      <Plus className="mr-0.5 h-3 w-3" />{q}
                    </Button>
                  ))}
                </div>
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

        {/* Right: Recent Stock In */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Stock In</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent stock in transactions.</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{tx.partName}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.createdByName} · {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-green-600">
                      +{tx.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
