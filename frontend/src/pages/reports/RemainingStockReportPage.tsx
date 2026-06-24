import { useState, useEffect, useMemo } from "react"
import { reportService } from "@/services/reportService"
import type { RemainingStockReport } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardList, Download, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import ExcelJS from "exceljs"

export function RemainingStockReportPage() {
  const [reports, setReports] = useState<RemainingStockReport[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const filtered = useMemo(() => {
    if (!search.trim()) return reports
    const q = search.toLowerCase()
    return reports.filter(
      (r) =>
        r.partNumber.toLowerCase().includes(q) ||
        (r.ourPartNumber || "").toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.model || "").toLowerCase().includes(q) ||
        (r.manufacturer || "").toLowerCase().includes(q) ||
        (r.location || "").toLowerCase().includes(q) ||
        (r.warehouse || "").toLowerCase().includes(q)
    )
  }, [reports, search])

  useEffect(() => {
    reportService.getRemainingStockReport()
      .then((res) => setReports(res.data))
      .catch(() => toast.error("Failed to load report"))
      .finally(() => setLoading(false))
  }, [])

  const downloadExcel = async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Remaining Stock")

    ws.mergeCells(1, 1, 1, 10)
    const titleRow = ws.getRow(1)
    titleRow.getCell(1).value = "REMAINING STOCK REPORT"
    titleRow.getCell(1).font = { bold: true, size: 16 }
    titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
    titleRow.height = 36

    const headers = [
      "ITEM NO.", "OUR PART NUMBER", "PART NUMBER", "DESCRIPTION",
      "MODELS", "MANUFACTURER", "LOCATIONS", "WEREHOUSES",
      "QUANTITY", "STOCK OUT"
    ]
    const headerRow = ws.addRow(headers)
    headerRow.font = { bold: true, size: 13 }
    headerRow.alignment = { horizontal: "center", vertical: "middle" }
    headerRow.height = 30

    const colWidths = [6, 16, 16, 28, 22, 16, 10, 10, 9, 9]
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w })

    reports.forEach((r, i) => {
      const row = ws.addRow([
        i + 1, r.ourPartNumber || "", r.partNumber, r.name,
        r.model || "", r.manufacturer || "", r.location || "",
        r.warehouse || "", r.currentQuantity, r.stockOut
      ])
      row.alignment = { vertical: "middle" }
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        }
      })
    })

    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "remaining-stock.xlsx"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Remaining Stock Report</h1>
        </div>
        <Button variant="outline" onClick={downloadExcel}>
          <Download className="mr-1 h-4 w-4" /> XLSX
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No parts registered.</p>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by part number, description, model, manufacturer, location, warehouse..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">ITEM NO.</th>
                    <th className="pb-2 font-medium">OUR PART NUMBER</th>
                    <th className="pb-2 font-medium">PART NUMBER</th>
                    <th className="pb-2 font-medium">DESCRIPTION</th>
                    <th className="pb-2 font-medium">MODELS</th>
                    <th className="pb-2 font-medium">MANUFACTURER</th>
                    <th className="pb-2 font-medium">LOCATIONS</th>
                    <th className="pb-2 font-medium">WEREHOUSES</th>
                    <th className="pb-2 font-medium">QUANTITY</th>
                    <th className="pb-2 font-medium">STOCK OUT</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2 font-mono text-xs">{r.ourPartNumber || ""}</td>
                      <td className="py-2 font-mono text-xs">{r.partNumber}</td>
                      <td className="py-2">{r.name}</td>
                      <td className="py-2">{r.model || "-"}</td>
                      <td className="py-2">{r.manufacturer || "-"}</td>
                      <td className="py-2">{r.location || "-"}</td>
                      <td className="py-2">{r.warehouse || "-"}</td>
                      <td className="py-2 font-medium">{r.currentQuantity}</td>
                      <td className="py-2">{r.stockOut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No records match your search.</p>
              )}
            </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
