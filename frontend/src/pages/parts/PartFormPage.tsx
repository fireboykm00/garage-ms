import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { partService } from "@/services/partService"
import { stockService } from "@/services/stockService"
import type { PartRequest, Stock } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, ArrowLeft, Lock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { AxiosError } from "axios"
import { ApiError } from "@/lib/api"

export function PartFormPage() {
  const { id, stockId } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const isStockLocked = !!stockId && !isEdit
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<PartRequest>({
    partNumber: "",
    ourPartNumber: "",
    name: "",
    model: "",
    manufacturer: "",
    unit: "pcs",
    currentQuantity: 0,
    minimumQuantity: 0,
    stockId: 0,
  })

  useDocumentTitle(isEdit ? "Edit Part" : "Add Part")

  // Load stocks list
  useEffect(() => {
    stockService.getAll()
      .then((res) => {
        setStocks(res.data)
        // Pre-select and lock stock if coming from stock detail page
        if (stockId && res.data.length > 0) {
          const sid = Number(stockId)
          if (res.data.some((s) => s.id === sid)) {
            setForm((prev) => ({ ...prev, stockId: sid }))
          }
        }
      })
      .catch(() => toast.error("Failed to load stocks"))
  }, [stockId])

  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      partService.getById(Number(id))
        .then((res) => {
          const p = res.data
          setForm({
            partNumber: p.partNumber,
            ourPartNumber: p.ourPartNumber || "",
            name: p.name,
            model: p.model || "",
            manufacturer: p.manufacturer || "",
            unit: p.unit,
            currentQuantity: p.currentQuantity,
            minimumQuantity: p.minimumQuantity,
            stockId: p.stockId,
          })
        })
        .catch(() => toast.error("Failed to load part"))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const lockedStockName = isStockLocked
    ? stocks.find((s) => s.id === Number(stockId))?.name
    : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.stockId) { toast.error("Select a stock"); return }
    setSaving(true)
    setFieldErrors({})
    try {
      if (isEdit) {
        await partService.update(Number(id), form)
        toast.success("Part updated")
      } else {
        await partService.create(form)
        toast.success("Part created")
      }
      // Navigate back to the stock detail page if we came from there
      if (form.stockId && !isEdit) {
        navigate(`/stocks/${form.stockId}/parts`)
      } else {
        navigate("/stocks")
      }
    } catch (err: unknown) {
      const knownFieldNames = ["partNumber", "ourPartNumber", "name", "model", "manufacturer", "unit", "stockId", "currentQuantity", "minimumQuantity"];
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as Record<string, string>;
        const hasFieldErrors = Object.keys(data).some((k) => knownFieldNames.includes(k));
        if (hasFieldErrors) {
          setFieldErrors(data);
        } else if (data.message) {
          toast.error(data.message);
        } else {
          toast.error(isEdit ? "Failed to update part" : "Failed to create part");
        }
      } else {
        const errMsg = err instanceof ApiError ? err.message : (isEdit ? "Failed to update part" : "Failed to create part");
        toast.error(errMsg);
      }
    } finally {
      setSaving(false)
    }
  }

  const update = (field: keyof PartRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs segments={[{ label: "Stocks", href: "/stocks" }, { label: "Edit Part" }]} />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            </div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[
        { label: "Stocks", href: "/stocks" },
        ...(isStockLocked && lockedStockName
          ? [{ label: lockedStockName, href: `/stocks/${stockId}/parts` }]
          : []),
        { label: isEdit ? "Edit Part" : "Add Part" }
      ]} />

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Part" : "Add Part"}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Update part details" : "Register a new spare part"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partNumber">Part Number *</Label>
                <Input id="partNumber" value={form.partNumber} onChange={(e) => update("partNumber", e.target.value)} required placeholder="e.g., 03H115562"
                  className={fieldErrors.partNumber ? "border-destructive" : ""} />
                {fieldErrors.partNumber && <p className="text-xs text-destructive">{fieldErrors.partNumber}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ourPartNumber">Our Part Number</Label>
                <Input id="ourPartNumber" value={form.ourPartNumber || ""} onChange={(e) => update("ourPartNumber", e.target.value)} placeholder="e.g., PLT-31400"
                  className={fieldErrors.ourPartNumber ? "border-destructive" : ""} />
                {fieldErrors.ourPartNumber && <p className="text-xs text-destructive">{fieldErrors.ourPartNumber}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Description *</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="e.g., Oil Filter"
                className={fieldErrors.name ? "border-destructive" : ""} />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" value={form.model || ""} onChange={(e) => update("model", e.target.value)} placeholder="e.g., Amarok, Hilux Revo"
                  className={fieldErrors.model ? "border-destructive" : ""} />
                {fieldErrors.model && <p className="text-xs text-destructive">{fieldErrors.model}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input id="manufacturer" value={form.manufacturer || ""} onChange={(e) => update("manufacturer", e.target.value)} placeholder="e.g., TOYOTA, SUZUKI"
                  className={fieldErrors.manufacturer ? "border-destructive" : ""} />
                {fieldErrors.manufacturer && <p className="text-xs text-destructive">{fieldErrors.manufacturer}</p>}
              </div>
            </div>
            {/* Stock dropdown — locked when coming from stock detail page */}
            <div className="space-y-2">
              <Label htmlFor="stock">
                Stock *
                {isStockLocked && <Lock className="ml-1 inline h-3 w-3 text-muted-foreground" />}
              </Label>
              <Select
                value={form.stockId ? String(form.stockId) : ""}
                onValueChange={(v) => update("stockId", Number(v))}
                disabled={isStockLocked}
              >
                <SelectTrigger disabled={isStockLocked}>
                  <SelectValue placeholder="Select a stock" />
                </SelectTrigger>
                <SelectContent>
                  {stocks.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No stocks available. Create one first.
                    </div>
                  )}
                  {stocks.map((stock) => (
                    <SelectItem key={stock.id} value={String(stock.id)}>
                      {stock.name}{stock.description ? ` — ${stock.description}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.stockId && <p className="text-xs text-destructive">{fieldErrors.stockId}</p>}
              {isStockLocked && (
                <p className="text-xs text-muted-foreground">
                  Part will be added to {lockedStockName || "this stock"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={form.unit} onValueChange={(v) => update("unit", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["pcs","liter","set","pair","kg","meter","box","can","roll","bottle","tube","pack"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.unit && <p className="text-xs text-destructive">{fieldErrors.unit}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentQuantity">Current Quantity</Label>
                <Input id="currentQuantity" type="number" min="0" value={form.currentQuantity} onChange={(e) => update("currentQuantity", parseInt(e.target.value) || 0)}
                  className={fieldErrors.currentQuantity ? "border-destructive" : ""} />
                {fieldErrors.currentQuantity && <p className="text-xs text-destructive">{fieldErrors.currentQuantity}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumQuantity">Minimum Quantity</Label>
                <Input id="minimumQuantity" type="number" min="0" value={form.minimumQuantity} onChange={(e) => update("minimumQuantity", parseInt(e.target.value) || 0)}
                  className={fieldErrors.minimumQuantity ? "border-destructive" : ""} />
                {fieldErrors.minimumQuantity && <p className="text-xs text-destructive">{fieldErrors.minimumQuantity}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : isEdit ? "Update Part" : "Create Part"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
