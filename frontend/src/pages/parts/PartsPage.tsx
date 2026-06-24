import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { partService } from "@/services/partService"
import type { Part } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Package, Plus, Pencil, Trash2, Search } from "lucide-react"
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

export function PartsPage() {
  const { isAdmin, isStorekeeper } = useAuth()
  const [parts, setParts] = useState<Part[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const canEdit = isAdmin || isStorekeeper

  const filtered = useMemo(() => {
    if (!search.trim()) return parts
    const q = search.toLowerCase()
    return parts.filter(
      (p) =>
        p.partNumber.toLowerCase().includes(q) ||
        (p.ourPartNumber || "").toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.model || "").toLowerCase().includes(q) ||
        (p.manufacturer || "").toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q) ||
        (p.warehouse || "").toLowerCase().includes(q)
    )
  }, [parts, search])

  useEffect(() => {
    partService.getAll()
      .then((res) => setParts(res.data))
      .catch(() => toast.error("Failed to load parts"))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await partService.delete(id)
      toast.success("Part deleted")
      partService.getAll()
        .then((res) => setParts(res.data))
        .catch(() => toast.error("Failed to load parts"))
    } catch {
      toast.error("Failed to delete part")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Parts</h1>
        </div>
        {canEdit && (
          <Button asChild>
            <Link to="/parts/new">
              <Plus className="mr-1 h-4 w-4" /> Add Part
            </Link>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by part number, description, model, manufacturer, location, warehouse..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : parts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No parts registered yet.</p>
            {canEdit && (
              <Button asChild className="mt-4">
                <Link to="/parts/new">Add Your First Part</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Our Part No.</th>
                <th className="pb-2 font-medium">Part Number</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Model</th>
                <th className="pb-2 font-medium">Manufacturer</th>
                <th className="pb-2 font-medium">Location</th>
                <th className="pb-2 font-medium">Warehouse</th>
                <th className="pb-2 font-medium">Qty</th>
                <th className="pb-2 font-medium">Status</th>
                {canEdit && <th className="pb-2 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((part) => (
                <tr key={part.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 font-mono text-xs">{part.ourPartNumber || ""}</td>
                  <td className="py-2 font-mono text-xs">{part.partNumber}</td>
                  <td className="py-2">{part.name}</td>
                  <td className="py-2 text-muted-foreground">{part.model || "-"}</td>
                  <td className="py-2">{part.manufacturer || "-"}</td>
                  <td className="py-2 text-muted-foreground">{part.location || "-"}</td>
                  <td className="py-2">{part.warehouse || "-"}</td>
                  <td className={`py-2 font-medium ${part.currentQuantity <= part.minimumQuantity ? "text-red-600" : ""}`}>
                    {part.currentQuantity} {part.unit}
                  </td>
                  <td className="py-2">
                    {part.currentQuantity <= part.minimumQuantity ? (
                      <Badge variant="destructive">Low</Badge>
                    ) : (
                      <Badge variant="default">OK</Badge>
                    )}
                  </td>
                  {canEdit && (
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/parts/${part.id}/edit`}>
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
        </div>
      )}
    </div>
  )
}
