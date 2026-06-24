import { api } from "@/lib/api"
import type { Part, JobCard } from "@/types"

export interface SearchResult {
  id: string
  label: string
  description?: string
  to: string
  type: "page" | "part" | "job"
}

const pages: SearchResult[] = [
  { id: "dashboard", label: "Dashboard", to: "/dashboard", type: "page" },
  { id: "jobs", label: "Job Cards", to: "/jobs", type: "page" },
  { id: "jobs-new", label: "New Job Card", to: "/jobs/new", type: "page" },
  { id: "parts", label: "Parts", to: "/parts", type: "page" },
  { id: "parts-new", label: "Add Part", to: "/parts/new", type: "page" },
  { id: "stock-in", label: "Stock In", to: "/stock/in", type: "page" },
  { id: "stock-out-report", label: "Stock Out Report", to: "/reports/stock-out", type: "page" },
  { id: "remaining-stock", label: "Remaining Stock", to: "/reports/remaining-stock", type: "page" },
  { id: "users", label: "Users", to: "/admin/users", type: "page" },
]

let partsCache: SearchResult[] | null = null
let jobsCache: SearchResult[] | null = null
let lastFetch = 0
const CACHE_TTL = 30000 // 30 seconds

async function fetchParts(): Promise<SearchResult[]> {
  if (partsCache && Date.now() - lastFetch < CACHE_TTL) return partsCache
  try {
    const res = await api.get<Part[]>("/parts")
    partsCache = res.data.map((p) => ({
      id: `part-${p.id}`,
      label: p.name,
      description: `${p.partNumber} · ${p.currentQuantity} ${p.unit}`,
      to: `/parts/${p.id}/edit`,
      type: "part" as const,
    }))
    lastFetch = Date.now()
    return partsCache
  } catch {
    return []
  }
}

async function fetchJobs(): Promise<SearchResult[]> {
  if (jobsCache && Date.now() - lastFetch < CACHE_TTL) return jobsCache
  try {
    const res = await api.get<JobCard[]>("/job-cards")
    jobsCache = res.data.map((j) => ({
      id: `job-${j.id}`,
      label: j.jobNumber,
      description: `${j.customerName} · ${j.vehicleRegistration || "No vehicle"}`,
      to: `/jobs/${j.id}`,
      type: "job" as const,
    }))
    lastFetch = Date.now()
    return jobsCache
  } catch {
    return []
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function searchAll(
  query: string,
  onResults: (results: SearchResult[]) => void
) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const q = query.toLowerCase().trim()
    if (!q) {
      onResults(pages)
      return
    }

    const pageResults = pages.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    )

    const [partResults, jobResults] = await Promise.all([
      fetchParts(),
      fetchJobs(),
    ])

    const filteredParts = partResults.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    )
    const filteredJobs = jobResults.filter(
      (j) =>
        j.label.toLowerCase().includes(q) ||
        (j.description || "").toLowerCase().includes(q)
    )

    onResults([...pageResults, ...filteredParts, ...filteredJobs])
  }, 300)
}
