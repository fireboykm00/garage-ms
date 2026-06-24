import { useState, useEffect, useMemo } from "react"
import { reportService } from "@/services/reportService"
import type { RemainingStockReport } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardList, Download, Search, BarChart3 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import ExcelJS from "exceljs"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function RemainingStockReportPage() {
  useDocumentTitle("Remaining Stock Report")
  const [reports, setReports] = useState<RemainingStockReport[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

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
        (r.stockName || "").toLowerCase().includes(q)
    )
  }, [reports, search])

  const totalParts = reports.length
  const totalStockOut = useMemo(() =>
    reports.reduce((sum, r) => sum + (r.stockOut || 0), 0),
    [reports]
  )

  useEffect(() => {
    reportService.getRemainingStockReport()
      .then((res) => setReports(res.data))
      .catch(() => toast.error("Failed to load report"))
      .finally(() => setLoading(false))
  }, [])

  const downloadExcel = async () => {
    setDownloading(true)
    try {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Remaining Stock")

    ws.mergeCells(1, 1, 1, 9)
    const titleRow = ws.getRow(1)
    titleRow.getCell(1).value = "GARAGE INVENTORY — Remaining Stock Report"
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } }
    titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
    titleRow.height = 40
    for (let c = 1; c <= 9; c++) {
      ws.getCell(1, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a365d" } }
    }

    const headers = [
      "ITEM NO.", "OUR PART NUMBER", "PART NUMBER", "DESCRIPTION",
      "MODELS", "MANUFACTURER", "STOCK",
      "BALANCE", "STOCK OUT"
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

    ws.autoFilter = {
      from: { row: headerRow.number, column: 1 },
      to: { row: headerRow.number, column: 9 }
    }

    reports.forEach((r, i) => {
      const row = ws.addRow([
        i + 1, r.ourPartNumber || "", r.partNumber, r.name,
        r.model || "", r.manufacturer || "", r.stockName || "",
        r.currentQuantity, r.stockOut || 0,
      ])
      row.alignment = { vertical: "middle" }
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        }
        cell.font = { size: 11 }
      })
      row.getCell(8).alignment = { horizontal: "right", vertical: "middle" }
      row.getCell(9).alignment = { horizontal: "right", vertical: "middle" }
      row.getCell(8).font = { bold: true, size: 11 }
      row.getCell(8).numFmt = '#,##0'
      row.getCell(9).numFmt = '#,##0'
      if (r.currentQuantity < r.minimumQuantity) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF0F0" } }
        })
        row.getCell(8).font = { bold: true, size: 11, color: { argb: "FFDC2626" } }
      }
      if (i % 2 === 0 && !(r.currentQuantity < r.minimumQuantity)) {
        row.eachCell((cell, colNum) => {
          if (colNum > 1 && cell.fill && "fgColor" in cell.fill && cell.fill.fgColor?.argb === "FFFFFFFF") {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } }
          }
        })
      }
    })

    const colWidths = [8, 16, 18, 30, 22, 18, 14, 10, 10]
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w })

    ws.views = [{ state: "frozen", ySplit: 2 }]
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "remaining-stock-report.xlsx"; a.click()
    URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to generate report")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ label: "Reports", href: "#" }, { label: "Remaining Stock" }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Remaining Stock Report</h1>
        </div>
        <Button variant="outline" onClick={downloadExcel} disabled={downloading}>
          <Download className="mr-1 h-4 w-4" /> {downloading ? "Exporting..." : "Export Report"}
        </Button>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-4 py-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-sm">
            <strong>Total Parts:</strong> {totalParts}
          </span>
          <span className="text-sm text-muted-foreground">|</span>
          <span className="text-sm">
            <strong>Total Stock Out:</strong> {totalStockOut.toLocaleString()}
          </span>
        </CardContent>
      </Card>

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
                  placeholder="Search by part number, description, model, manufacturer, stock..."
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
                      <th className="pb-2 font-medium">STOCK</th>
                      <th className="pb-2 font-medium">BALANCE</th>
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
                        <td className="py-2">{r.stockName || "-"}</td>
                        <td className="py-2 font-medium">{r.currentQuantity}</td>
                        <td className="py-2">{r.stockOut || 0}</td>
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
