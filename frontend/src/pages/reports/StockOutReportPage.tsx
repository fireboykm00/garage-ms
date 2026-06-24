import { useState, useEffect, useMemo } from "react"
import { reportService } from "@/services/reportService"
import type { StockOutReport } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Download, Search, BarChart3 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import ExcelJS from "exceljs"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function StockOutReportPage() {
  useDocumentTitle("Stock Out Report")
  const [reports, setReports] = useState<StockOutReport[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [dateFilterApplied, setDateFilterApplied] = useState(false)

  useEffect(() => {
    reportService.getStockOutReport()
      .then((res) => setReports(res.data))
      .catch(() => toast.error("Failed to load report"))
      .finally(() => setLoading(false))
  }, [])

  const dateFiltered = useMemo(() => {
    if (!dateFilterApplied || (!startDate && !endDate)) return reports
    return reports.filter((r) => {
      const d = new Date(r.createdAt)
      if (startDate && d < new Date(startDate)) return false
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })
  }, [reports, startDate, endDate, dateFilterApplied])

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered
    const q = search.toLowerCase()
    return dateFiltered.filter(
      (r) =>
        r.partNumber.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q)
    )
  }, [dateFiltered, search])

  const totalQuantity = useMemo(() =>
    filtered.reduce((sum, r) => sum + r.quantity, 0),
    [filtered]
  )

  const uniqueParts = useMemo(() =>
    new Set(filtered.map((r) => r.partNumber)).size,
    [filtered]
  )

  const downloadExcel = async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Stock Out")

    // Title row
    ws.mergeCells(1, 1, 1, 5)
    const titleRow = ws.getRow(1)
    titleRow.getCell(1).value = "GARAGE INVENTORY — Stock Out Report"
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } }
    titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
    titleRow.height = 40
    // Navy background for title
    for (let c = 1; c <= 5; c++) {
      ws.getCell(1, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a365d" } }
    }

    // Header row
    const headers = [
      "ITEM NO.", "PART NUMBER", "DESCRIPTION", "QTY REMOVED",
      "DATE"
    ]
    const headerRow = ws.addRow(headers)
    for (let c = 1; c <= headers.length; c++) {
      const cell = headerRow.getCell(c)
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a365d" } }
      cell.alignment = { horizontal: "center", vertical: "middle" }
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      }
    }
    headerRow.height = 28

    // Data rows
    filtered.forEach((r, i) => {
      const row = ws.addRow([
        i + 1, r.partNumber, r.partName, r.quantity,
        formatExcelDate(r.createdAt)
      ])
      row.alignment = { vertical: "middle" }
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        }
        cell.font = { size: 11 }
      })
    })

    // Auto-width
    const colWidths = [8, 22, 38, 14, 18]
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w })

    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "stock-out-report.xlsx"; a.click()
    URL.revokeObjectURL(url)
  }

  const formatExcelDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const day = String(d.getDate()).padStart(2, "0")
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  }

  const applyDateFilter = () => {
    setDateFilterApplied(true)
  }

  const clearDateFilter = () => {
    setStartDate("")
    setEndDate("")
    setDateFilterApplied(false)
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ label: "Reports", href: "#" }, { label: "Stock Out" }]} />

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Stock Out Report</h1>
          </div>
          <Button variant="outline" onClick={downloadExcel}>
            <Download className="mr-1 h-4 w-4" /> XLSX
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-4 py-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-sm">
            <strong>Total Items Removed:</strong> {totalQuantity}
          </span>
          <span className="text-sm text-muted-foreground">|</span>
          <span className="text-sm">
            <strong>Unique Parts:</strong> {uniqueParts}
          </span>
          {(startDate || endDate) && dateFilterApplied && (
            <Badge variant="outline" className="text-xs">
              Filtered: {startDate || "..."} — {endDate || "..."}
            </Badge>
          )}
        </CardContent>
      </Card>

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
              {/* Date range and search */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8" />
                </div>
                <Button size="sm" onClick={applyDateFilter}>Apply</Button>
                {(startDate || endDate) && dateFilterApplied && (
                  <Button size="sm" variant="ghost" onClick={clearDateFilter}>Clear</Button>
                )}
                <div className="relative ml-auto flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 h-8"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Item No.</th>
                      <th className="pb-2 font-medium">Part Number</th>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium">Qty Removed</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 text-muted-foreground text-xs">{idx + 1}</td>
                        <td className="py-2 font-mono text-xs">{r.partNumber}</td>
                        <td className="py-2">{r.partName}</td>
                        <td className="py-2">{r.quantity}</td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No records match your filters.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
