import { useState, useEffect, useRef } from "react"
import { partService } from "@/services/partService"
import { stockService } from "@/services/stockService"
import type { Part } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandInput } from "@/components/ui/command"
import { ArrowUpFromLine, AlertTriangle, Search } from "lucide-react"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { toast } from "sonner"

const REASONS = ["Job Card", "Adjustment", "Return to Supplier", "Damaged", "Other"]

export function StockOutPage() {
  useDocumentTitle("Stock Out")
  const [parts, setParts] = useState<Part[]>([])
  const [partSearch, setPartSearch] = useState("")
  const [form, setForm] = useState({
    partId: 0,
    quantity: 1,
    note: "",
    reason: "",
    jobCardNumber: "",
  })
  const [saving, setSaving] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [suggestions, setSuggestions] = useState<Part[]>([])

  useEffect(() => {
    partService.getAll().then((res) => {
      setParts(res.data)
      setSuggestions(res.data)
    }).catch(() => toast.error("Failed to load parts"))
  }, [])

  // Debounced part search for suggestions (200ms debounce per spec)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!partSearch.trim()) {
      setSuggestions(parts.slice(0, 20))
      return
    }
    debounceRef.current = setTimeout(() => {
      const q = partSearch.toLowerCase()
      setSuggestions(
        parts.filter(
          (p) =>
            p.partNumber.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q)
        ).slice(0, 20)
      )
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [partSearch, parts])

  const selectedPart = parts.find((p) => p.id === form.partId)
  const exceedsStock = selectedPart && form.quantity > selectedPart.currentQuantity
  const usageRatio = selectedPart ? Math.min(form.quantity / selectedPart.currentQuantity, 1) : 0
  const showJobCardInput = form.reason === "Job Card"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.partId) { toast.error("Select a part"); return }
    if (exceedsStock) { toast.error("Quantity exceeds available stock"); return }
    if (!form.reason) { toast.error("Select a reason"); return }
    if (showJobCardInput && !form.jobCardNumber.trim()) { toast.error("Enter job card number"); return }

    setSaving(true)
    try {
      const noteParts = [form.note]
      if (form.reason) noteParts.push(`Reason: ${form.reason}`)
      if (showJobCardInput && form.jobCardNumber) noteParts.push(`Job: ${form.jobCardNumber}`)
      const res = await stockService.stockOut({
        partId: form.partId,
        quantity: form.quantity,
        note: noteParts.join(" | "),
      })
      toast.success("Stock out recorded", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await stockService.undoTransaction(res.data.id)
              toast.success("Stock out undone")
              const partsRes = await partService.getAll()
              setParts(partsRes.data)
              setSuggestions(partsRes.data)
            } catch {
              toast.error("Failed to undo")
            }
          },
        },
      })
      setForm({ partId: 0, quantity: 1, note: "", reason: "", jobCardNumber: "" })
      setPartSearch("")
      const partsRes = await partService.getAll()
      setParts(partsRes.data)
      setSuggestions(partsRes.data)
    } catch {
      toast.error("Failed to record stock out")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs segments={[{ label: "Stock Out" }]} />
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
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9 cursor-pointer"
                      placeholder="Search parts..."
                      value={selectedPart ? `${selectedPart.partNumber} — ${selectedPart.name}` : partSearch}
                      onChange={(e) => {
                        setPartSearch(e.target.value)
                        if (form.partId) setForm({ ...form, partId: 0 })
                        setPopoverOpen(true)
                      }}
                      onFocus={() => setPopoverOpen(true)}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search parts..."
                      value={partSearch}
                      onValueChange={setPartSearch}
                    />
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {suggestions.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          No parts found
                        </div>
                      ) : (
                        suggestions.map((part) => (
                          <CommandItem
                            key={part.id}
                            value={`${part.partNumber} ${part.name}`}
                            onSelect={() => {
                              setForm({ ...form, partId: part.id })
                              setPartSearch("")
                              setPopoverOpen(false)
                            }}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div>
                                <span className="font-mono text-xs">{part.partNumber}</span>
                                <span className="ml-2">{part.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {part.currentQuantity} {part.unit}
                              </span>
                            </div>
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedPart && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Available stock: <strong>{selectedPart.currentQuantity}</strong> {selectedPart.unit}
                </p>
                {selectedPart.warehouse && (
                  <p className="text-xs text-muted-foreground">
                    Warehouse: {selectedPart.warehouse}
                  </p>
                )}
              </div>
            )}

            {exceedsStock && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Insufficient stock! Available: {selectedPart?.currentQuantity} {selectedPart?.unit}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Remove</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              />
              {selectedPart && form.quantity > 0 && !exceedsStock && (
                <div className="space-y-1">
                  <Progress value={usageRatio * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {form.quantity}/{selectedPart.currentQuantity} used
                  </p>
                </div>
              )}
              {exceedsStock && (
                <div className="space-y-1">
                  <Progress value={100} className="h-2 bg-destructive/20 [&>div]:bg-destructive" />
                  <p className="text-xs text-destructive">
                    {form.quantity}/{selectedPart?.currentQuantity} — exceeds available stock!
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showJobCardInput && (
              <div className="space-y-2">
                <Label htmlFor="jobCardNumber">Job Card Number *</Label>
                <Input
                  id="jobCardNumber"
                  value={form.jobCardNumber}
                  onChange={(e) => setForm({ ...form, jobCardNumber: e.target.value })}
                  placeholder="e.g., JC-2026-0012"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="note">Additional Notes (optional)</Label>
              <Textarea id="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Additional details..." />
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
