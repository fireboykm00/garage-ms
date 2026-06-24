import { useState, useEffect, useMemo } from "react"
import { reportService } from "@/services/reportService"
import type { AggregatedStockOutReport } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Download, Search, CalendarDays } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import ExcelJS from "exceljs"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function StockOutReportPage() {
  useDocumentTitle("Stock Out Report")
  const [reports, setReports] = useState<AggregatedStockOutReport[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [dateFilterApplied, setDateFilterApplied] = useState(false)

  useEffect(() => {
    reportService.getAggregatedStockOutReport()
      .then((res) => setReports(res.data))
      .catch(() => toast.error("Failed to load report"))
      .finally(() => setLoading(false))
  }, [])

  const dateFiltered = useMemo(() => {
    if (!dateFilterApplied || (!startDate && !endDate)) return reports
    return reports.filter((r) => {
      const d = new Date(r.date)
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
    return dateFiltered
      .map((day) => ({
        ...day,
        entries: day.entries.filter(
          (e) =>
            e.partNumber.toLowerCase().includes(q) ||
            e.partName.toLowerCase().includes(q)
        ),
      }))
      .filter((day) => day.entries.length > 0)
  }, [dateFiltered, search])

  const overallTotal = useMemo(() =>
    filtered.reduce((sum, d) => sum + d.dailyTotal, 0),
    [filtered]
  )

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    })
  }

  const downloadExcel = async () => {
    setDownloading(true)
    try {
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet("Stock Out (Aggregated)")

    ws.mergeCells(1, 1, 1, 4)
    const titleRow = ws.getRow(1)
    let titleText = "GARAGE INVENTORY — Aggregated Stock Out Report"
    if (dateFilterApplied && (startDate || endDate)) {
      titleText += ` (Filtered: ${startDate || "..."} — ${endDate || "..."})`
    }
    titleRow.getCell(1).value = titleText
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } }
    titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
    titleRow.height = 40
    for (let c = 1; c <= 4; c++) {
      ws.getCell(1, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a365d" } }
    }

    const headers = ["DATE", "PART NUMBER", "DESCRIPTION", "QTY CONSUMED"]
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
      to: { row: headerRow.number, column: 4 }
    }

    let dataRowNum = 0
    filtered.forEach((day) => {
      day.entries.forEach((entry) => {
        dataRowNum++
        const row = ws.addRow([
          formatDate(day.date), entry.partNumber, entry.partName, entry.totalQuantity
        ])
        row.alignment = { vertical: "middle" }
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" }
          }
          cell.font = { size: 11 }
        })
        row.getCell(4).font = { bold: true, size: 11 }
        row.getCell(4).alignment = { horizontal: "right", vertical: "middle" }
        row.getCell(4).numFmt = '#,##0'
        if (dataRowNum % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } }
          })
        }
      })
      // Daily total row
      const totalRow = ws.addRow([`Total for ${formatDate(day.date)}`, "", "", day.dailyTotal])
      totalRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11 }
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        }
      })
    })

    const grandTotalRow = ws.addRow(["GRAND TOTAL", "", "", overallTotal])
    grandTotalRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a365d" } }
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      }
      cell.alignment = { horizontal: "center", vertical: "middle" }
    })

    const colWidths = [22, 22, 38, 14]
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w })

    ws.views = [{ state: "frozen", ySplit: 2 }]
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "stock-out-report-aggregated.xlsx"; a.click()
    URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to generate report")
    } finally {
      setDownloading(false)
    }
  }

  const applyDateFilter = () => setDateFilterApplied(true)
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
          <Button variant="outline" onClick={downloadExcel} disabled={downloading}>
            <Download className="mr-1 h-4 w-4" /> {downloading ? "Exporting..." : "Export Report"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items Consumed from Stock</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filters */}
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
                {dateFilterApplied && (
                  <Button size="sm" variant="ghost" onClick={clearDateFilter}>Clear</Button>
                )}
                <div className="relative ml-auto flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 h-8"
                    placeholder="Search parts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stock out records found.</p>
              ) : (
                <>
                  {/* Grouped by date */}
                  <div className="space-y-4">
                    {filtered.map((day) => {
                      return (
                        <div key={day.date} className="rounded-lg border">
                          {/* Date header */}
                      <div className="flex w-full items-center justify-between bg-muted/30 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="font-semibold">{formatDate(day.date)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-muted-foreground tracking-wider uppercase">Total consumed</div>
                          <div className="text-xl font-bold tabular-nums">{day.dailyTotal}</div>
                        </div>
                      </div>
                          <div className="overflow-x-auto px-4">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                  <th className="pb-2 font-medium">PART NUMBER</th>
                                  <th className="pb-2 font-medium">DESCRIPTION</th>
                                  <th className="pb-2 font-medium text-right">QTY CONSUMED</th>
                                </tr>
                              </thead>
                              <tbody>
                                {day.entries.map((entry) => (
                                  <tr key={`${day.date}-${entry.partNumber}`} className="border-b last:border-0">
                                    <td className="py-2 font-mono text-xs">{entry.partNumber}</td>
                                    <td className="py-2">{entry.partName}</td>
                                    <td className="py-2 text-right font-medium">{entry.totalQuantity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Overall total */}
                  <div className="flex justify-end border-t pt-4">
                    <div className="rounded-lg bg-primary/5 px-6 py-3">
                      <span className="text-sm font-semibold">
                        Overall Total: <span className="text-lg">{overallTotal}</span> units
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
