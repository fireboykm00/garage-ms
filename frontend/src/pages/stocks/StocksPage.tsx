import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { stockService } from "@/services/stockService"
import type { Stock } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Package, Plus, Pencil, Trash2, Search, Warehouse } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function StocksPage() {
  useDocumentTitle("Stocks")
  const { isAdmin, isStorekeeper } = useAuth()
  const navigate = useNavigate()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const [deletingStock, setDeletingStock] = useState<Stock | null>(null)
  const [form, setForm] = useState({ name: "", description: "" })
  const [saving, setSaving] = useState(false)

  const canEdit = isAdmin || isStorekeeper

  useEffect(() => {
    stockService.getAll()
      .then((res) => setStocks(res.data))
      .catch(() => toast.error("Failed to load stocks"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? stocks.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(search.toLowerCase())
      )
    : stocks

  const openCreate = () => {
    setEditingStock(null)
    setForm({ name: "", description: "" })
    setDialogOpen(true)
  }

  const openEdit = (stock: Stock) => {
    setEditingStock(stock)
    setForm({ name: stock.name, description: stock.description || "" })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      if (editingStock) {
        await stockService.update(editingStock.id, form)
        toast.success("Stock updated")
      } else {
        await stockService.create(form)
        toast.success("Stock created")
      }
      setDialogOpen(false)
      const res = await stockService.getAll()
      setStocks(res.data)
    } catch {
      toast.error(editingStock ? "Failed to update stock" : "Failed to create stock")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingStock) return
    try {
      await stockService.delete(deletingStock.id)
      toast.success("Stock deleted")
      setDeletingStock(null)
      const res = await stockService.getAll()
      setStocks(res.data)
    } catch {
      toast.error("Failed to delete stock (it may have parts assigned)")
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ label: "Stocks" }]} />

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 pt-2 -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Stocks</h1>
          </div>
          {canEdit && (
            <Button onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> New Stock
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search stocks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Warehouse className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-1">No stocks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first stock location.</p>
            {canEdit && <Button onClick={openCreate}>Create Stock</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((stock) => (
            <Card
              key={stock.id}
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => navigate(`/stocks/${stock.id}/parts`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{stock.name}</h3>
                      {stock.description && (
                        <p className="text-xs text-muted-foreground">{stock.description}</p>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(stock)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingStock(stock)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Click to view parts</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStock ? "Edit Stock" : "New Stock"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stockName">Name *</Label>
              <Input
                id="stockName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., HEAD Q, H1, H2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockDesc">Description</Label>
              <Textarea
                id="stockDesc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g., Main warehouse, Nairobi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingStock ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingStock} onOpenChange={(open) => !open && setDeletingStock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingStock?.name}"? This cannot be undone if parts are assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
