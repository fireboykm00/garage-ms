import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { partService } from "@/services/partService"
import { stockService } from "@/services/stockService"
import type { Part, Stock } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Package, Plus, Pencil, Trash2, Search, AlertTriangle, ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function StockDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isStorekeeper } = useAuth()
  const canEdit = isAdmin || isStorekeeper

  const [stock, setStock] = useState<Stock | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useDocumentTitle(stock ? `${stock.name} — Parts` : "Stock Parts")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      stockService.getById(Number(id)),
      stockService.getParts(Number(id)),
    ])
      .then(([stockRes, partsRes]) => {
        setStock(stockRes.data)
        setParts(partsRes.data)
      })
      .catch(() => toast.error("Failed to load stock details"))
      .finally(() => setLoading(false))
  }, [id])

  const filtered = useMemo(() => {
    if (!search.trim()) return parts
    const q = search.toLowerCase()
    return parts.filter(
      (p) =>
        p.partNumber.toLowerCase().includes(q) ||
        (p.ourPartNumber || "").toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.model || "").toLowerCase().includes(q) ||
        (p.manufacturer || "").toLowerCase().includes(q)
    )
  }, [parts, search])

  const handleDelete = async (partId: number) => {
    try {
      await partService.delete(partId)
      toast.success("Part deleted")
      const res = await stockService.getParts(Number(id))
      setParts(res.data)
    } catch {
      toast.error("Failed to delete part")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    )
  }

  if (!stock) {
    return (
      <div className="space-y-6">
        <Breadcrumbs segments={[{ label: "Stocks", href: "/stocks" }, { label: "Not Found" }]} />
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Stock not found</h3>
            <Button asChild className="mt-4">
              <Link to="/stocks">Back to Stocks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[
        { label: "Stocks", href: "/stocks" },
        { label: stock.name },
      ]} />

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/stocks")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{stock.name}</h1>
              {stock.description && (
                <p className="text-sm text-muted-foreground">{stock.description}</p>
              )}
            </div>
          </div>
          {canEdit && (
            <Button asChild>
              <Link to={`/stocks/${stock.id}/parts/new`}>
                <Plus className="mr-1 h-4 w-4" /> Add Part
              </Link>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground ml-14">
          {parts.length} part{parts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search parts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {parts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-1">No parts in this stock</h3>
            <p className="text-sm text-muted-foreground mb-4">Add parts to this stock location.</p>
            {canEdit && (
              <Button asChild>
                <Link to={`/stocks/${stock.id}/parts/new`}>Add Your First Part</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Our Part No.</th>
                <th className="p-3 font-medium">Part Number</th>
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Model</th>
                <th className="p-3 font-medium">Manufacturer</th>
                <th className="p-3 font-medium">Balance</th>
                <th className="p-3 font-medium">Status</th>
                {canEdit && <th className="p-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((part) => (
                <tr key={part.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{part.ourPartNumber || ""}</td>
                  <td className="p-3 font-mono text-xs">{part.partNumber}</td>
                  <td className="p-3">{part.name}</td>
                  <td className="p-3 text-muted-foreground">{part.model || "-"}</td>
                  <td className="p-3">{part.manufacturer || "-"}</td>
                  <td className={`p-3 font-medium ${part.currentQuantity <= part.minimumQuantity ? "text-destructive" : ""}`}>
                    {part.currentQuantity} {part.unit}
                  </td>
                  <td className="p-3">
                    {part.currentQuantity <= part.minimumQuantity ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Low
                      </Badge>
                    ) : (
                      <Badge variant="default">OK</Badge>
                    )}
                  </td>
                  {canEdit && (
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/stocks/${stock.id}/parts/${part.id}/edit`}>
                            <Pencil className="h-3 w-3" />
                          </Link>
                        </Button>
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Part</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{part.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(part.id)} className="bg-destructive">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No matching parts.</p>
          )}
        </div>
      )}
    </div>
  )
}
