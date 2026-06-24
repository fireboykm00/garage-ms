import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { JobCard, JobCardPart } from "@/types"

export function generateJobCardPDF(job: JobCard, parts: JobCardPart[]) {
  const doc = new jsPDF("portrait", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  let y = margin

  const statusLabel: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  }

  const drawHeader = () => {
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("GARAGE", pageWidth / 2, y, { align: "center" })
    y += 7
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("123 Industrial Area · Nairobi · +254 700 123 456", pageWidth / 2, y, { align: "center" })
    y += 4
    doc.text("info@garage.com · www.garage.com", pageWidth / 2, y, { align: "center" })
    y += 8

    doc.setDrawColor(200)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
  }

  const drawSectionTitle = (title: string) => {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(title, margin, y)
    y += 2
    doc.setDrawColor(200)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
  }

  const drawMultiline = (text: string | null, maxWidth: number) => {
    if (!text) {
      y += 5
      return
    }
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    const lines = doc.splitTextToSize(text, maxWidth)
    for (const line of lines) {
      if (y > 275) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 4.5
    }
    y += 3
  }

  drawHeader()

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("JOB CARD", pageWidth / 2, y, { align: "center" })
  y += 7
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(job.jobNumber, pageWidth / 2, y, { align: "center" })
  y += 8

  doc.setDrawColor(200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  const drawInfoBoxes = () => {
    const boxW = contentWidth / 2 - 4

    doc.setDrawColor(180)
    doc.setLineWidth(0.4)
    doc.rect(margin, y, boxW, 22)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0)
    doc.text("CUSTOMER", margin + 3, y + 5)
    doc.setFont("helvetica", "normal")
    doc.text("Name:", margin + 3, y + 12)
    doc.setFont("helvetica", "bold")
    doc.text(job.customerName, margin + 22, y + 12)
    doc.setFont("helvetica", "normal")
    doc.text("Phone:", margin + 3, y + 19)
    doc.setFont("helvetica", "bold")
    doc.text(job.customerPhone || "—", margin + 22, y + 19)

    doc.rect(margin + boxW + 8, y, boxW, 22)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0)
    doc.text("VEHICLE", margin + boxW + 11, y + 5)
    doc.setFont("helvetica", "normal")
    doc.text("Reg:", margin + boxW + 11, y + 12)
    doc.setFont("helvetica", "bold")
    doc.text(job.vehicleRegistration || "—", margin + boxW + 26, y + 12)
    doc.setFont("helvetica", "normal")
    doc.text("Model:", margin + boxW + 11, y + 19)
    doc.setFont("helvetica", "bold")
    doc.text(job.vehicleModel || "—", margin + boxW + 26, y + 19)

    y += 30
  }

  drawInfoBoxes()

  drawSectionTitle("WORK REQUESTED")
  drawMultiline(job.requestedWork, contentWidth)

  drawSectionTitle("TECHNICAL REPORT")
  drawMultiline(job.technicalReport, contentWidth)

  drawSectionTitle("WORK COMPLETED")
  drawMultiline(job.workCompleted, contentWidth)

  drawSectionTitle("PARTS USED")

  if (parts.length === 0) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.text("No parts used.", margin, y)
    y += 6
  } else {
    const tableData = parts.map((p) => [p.partNumber, p.partName, String(p.quantity), p.unit || "-"])

    autoTable(doc, {
      startY: y,
      head: [["Part Number", "Description", "Qty", "Unit"]],
      body: tableData,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [41, 41, 41],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
        halign: "left",
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        2: { halign: "center", cellWidth: 15 },
        3: { halign: "center", cellWidth: 15 },
      },
      theme: "grid",
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  if (y > 260) {
    doc.addPage()
    y = margin
  }

  doc.setDrawColor(200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(`Status: ${statusLabel[job.status] || job.status}`, margin, y)
  y += 5
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(
    `Created by: ${job.createdByName}  |  ${new Date(job.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    margin,
    y,
  )
  y += 3
  doc.text(
    `Last updated: ${new Date(job.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    margin,
    y,
  )
  y += 12

  const sigY = Math.max(y, 240)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.line(margin, sigY, margin + 60, sigY)
  doc.text("Customer Signature", margin, sigY + 4)
  doc.line(pageWidth - margin - 60, sigY, pageWidth - margin, sigY)
  doc.text("Mechanic / Authorised By", pageWidth - margin - 60, sigY + 4)

  doc.setFontSize(7)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(150)
  doc.text("This is a computer-generated document.", pageWidth / 2, 290, { align: "center" })

  const filename = `${job.jobNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`
  doc.save(filename)
}
