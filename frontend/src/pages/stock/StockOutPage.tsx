import { useState, useEffect, useRef } from "react"
import { stockService } from "@/services/stockService"
import type { Stock, Part } from "@/types"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const REASONS = ["Job Card", "Adjustment", "Return to Supplier", "Damaged", "Other"]

export function StockOutPage() {
  useDocumentTitle("Stock Out")
  const [stocks, setStocks] = useState<Stock[]>([])
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loadingParts, setLoadingParts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [successFlash, setSuccessFlash] = useState(false)
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
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    stockService.getAll()
      .then((res) => setStocks(res.data))
      .catch(() => toast.error("Failed to load stocks"))
      .finally(() => setLoading(false))
  }, [])

  // Update suggestions when parts change
  useEffect(() => {
    setSuggestions(parts.slice(0, 20))
  }, [parts])

  const handleStockChange = async (stockId: string) => {
    const stock = stocks.find((s) => s.id === Number(stockId)) || null
    setSelectedStock(stock)
    setForm({ partId: 0, quantity: 1, note: "", reason: "", jobCardNumber: "" })
    if (stock) {
      setLoadingParts(true)
      try {
        const res = await stockService.getParts(stock.id)
        setParts(res.data)
      } catch {
        toast.error("Failed to load parts")
        setParts([])
      } finally {
        setLoadingParts(false)
      }
    } else {
      setParts([])
    }
  }

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
              if (selectedStock) {
                const partsRes = await stockService.getParts(selectedStock.id)
                setParts(partsRes.data)
              }
            } catch {
              toast.error("Failed to undo")
            }
          },
        },
      })
      setSuccessFlash(true)
      setTimeout(() => setSuccessFlash(false), 1500)
      setForm({ partId: 0, quantity: 1, note: "", reason: "", jobCardNumber: "" })
      // Refresh data (separate try/catch so refresh failures don't override success)
      if (selectedStock) {
        try {
          const partsRes = await stockService.getParts(selectedStock.id)
          setParts(partsRes.data)
        } catch {
          // Silent — refresh failure shouldn't override success
        }
      }
      // Scroll to top
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    } catch {
      toast.error("Failed to record stock out")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs segments={[{ label: "Stock Out" }]} />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ label: "Stock Out" }]} />
      <div className="flex items-center gap-2">
        <ArrowUpFromLine className="h-6 w-6 text-orange-600" />
        <h1 className="text-2xl font-bold tracking-tight">Stock Out</h1>
      </div>

      <div
        ref={formRef}
        className={cn(
          "transition-colors duration-500",
          successFlash && "bg-green-50 dark:bg-green-950/20 rounded-lg p-4 -m-4"
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle>Record parts leaving stock</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Select Stock */}
              <div className="space-y-2">
                <Label>Stock</Label>
                <Select
                  value={selectedStock ? String(selectedStock.id) : ""}
                  onValueChange={handleStockChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {stocks.length === 0 && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No stocks available
                      </div>
                    )}
                    {stocks.map((stock) => (
                      <SelectItem key={stock.id} value={String(stock.id)}>
                        {stock.name}{stock.description ? ` — ${stock.description}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Part */}
              {selectedStock && (
                <div className="space-y-2">
                  <Label>Part</Label>
                  {loadingParts ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pl-9 cursor-pointer"
                            placeholder="Search parts..."
                            value={selectedPart ? `${selectedPart.partNumber} — ${selectedPart.name}` : ""}
                            onFocus={() => setPopoverOpen(true)}
                            readOnly
                          />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search parts..."
                            onValueChange={(v) => {
                              if (debounceRef.current) clearTimeout(debounceRef.current)
                              debounceRef.current = setTimeout(() => {
                                const q = v.toLowerCase()
                                setSuggestions(
                                  parts.filter(
                                    (p) =>
                                      p.partNumber.toLowerCase().includes(q) ||
                                      p.name.toLowerCase().includes(q)
                                  ).slice(0, 20)
                                )
                              }, 200)
                            }}
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
                                    setPopoverOpen(false)
                                  }}
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <div>
                                      <span className="font-mono text-xs">{part.partNumber}</span>
                                      <span className="ml-2">{part.name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      Balance: {part.currentQuantity} {part.unit}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}

              {selectedPart && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Balance: <strong>{selectedPart.currentQuantity}</strong> {selectedPart.unit}
                  </p>
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

              <Button type="submit" className="w-full" disabled={saving || !!exceedsStock || !form.partId}>
                {saving ? "Recording..." : "Record Stock Out"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
