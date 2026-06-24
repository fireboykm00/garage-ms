import { useState, useEffect, useMemo } from "react"
import { reportService } from "@/services/reportService"
import type { StockOutReport } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Download, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import ExcelJS from "exceljs"

export function StockOutReportPage() {
  const [reports, setReports] = useState<StockOutReport[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const filtered = useMemo(() => {
    if (!search.trim()) return reports
    const q = search.toLowerCase()
    return reports.filter(
      (r) =>
        r.partNumber.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q)
    )
  }, [reports, search])

  useEffect(() => {
    reportService.getStockOutReport()
      .then((res) => setReports(res.data))
      .catch(() => toast.error("Failed to load report"))
      .finally(() => setLoading(false))
  }, [])

  const downloadExcel = async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Stock Out")

    ws.mergeCells(1, 1, 1, 5)
    const titleRow = ws.getRow(1)
    titleRow.getCell(1).value = "STOCK OUT REPORT"
    titleRow.getCell(1).font = { bold: true, size: 16 }
    titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
    titleRow.height = 36

    const headers = [
      "ITEM NO.", "PART NUMBER", "DESCRIPTION", "QTY REMOVED",
      "DATE"
    ]
    const headerRow = ws.addRow(headers)
    headerRow.font = { bold: true, size: 13 }
    headerRow.alignment = { horizontal: "center", vertical: "middle" }
    headerRow.height = 30

    const colWidths = [6, 20, 35, 12, 16]
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w })

    reports.forEach((r, i) => {
      const row = ws.addRow([
        i         + 1, r.partNumber, r.partName, r.quantity,
        new Date(r.createdAt).toLocaleDateString()
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
    a.href = url; a.download = "stock-out.xlsx"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Stock Out Report</h1>
        </div>
        <Button variant="outline" onClick={downloadExcel}>
          <Download className="mr-1 h-4 w-4" /> XLSX
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items Removed from Stock</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock out records found.</p>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by part number or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Part Number</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Qty Removed</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{r.partNumber}</td>
                      <td className="py-2">{r.partName}</td>
                      <td className="py-2">{r.quantity}</td>
                      <td className="py-2 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
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
