export interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: string
  enabled: boolean
  createdAt: string
}

export interface JwtResponse {
  token: string
  type: string
  id: number
  username: string
  email: string
  fullName: string
  role: string
  roles: string[]
}

export interface LoginRequest {
  username: string
  password: string
}

export interface UpdateProfileRequest {
  fullName?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

export interface MessageResponse {
  message: string
}

export interface ApiError {
  error: string
  details?: Record<string, string>
}

export interface Stock {
  id: number
  name: string
  description: string | null
  createdAt: string
}

export interface Part {
  id: number
  partNumber: string
  ourPartNumber: string | null
  name: string
  model: string | null
  manufacturer: string | null
  unit: string
  currentQuantity: number
  minimumQuantity: number
  stockId: number
  stockName: string
  createdAt: string
  updatedAt: string
}

export interface PartRequest {
  partNumber: string
  ourPartNumber?: string
  name: string
  model?: string
  manufacturer?: string
  unit: string
  currentQuantity: number
  minimumQuantity: number
  stockId: number
}

export interface StockTransaction {
  id: number
  partId: number
  partNumber: string
  partName: string
  type: "IN" | "OUT"
  quantity: number
  note: string
  createdByName: string
  createdAt: string
}

export interface StockInRequest {
  partId: number
  quantity: number
  note?: string
}

export interface StockOutRequest {
  partId: number
  quantity: number
  note?: string
}

export interface StockOutReport {
  id: number
  partNumber: string
  partName: string
  quantity: number
  note: string
  createdByName: string
  createdAt: string
}

export interface RemainingStockReport {
  id: number
  partNumber: string
  ourPartNumber: string | null
  name: string
  model: string | null
  manufacturer: string | null
  unit: string
  currentQuantity: number
  minimumQuantity: number
  stockOut: number
  updatedAt: string
  stockId: number
  stockName: string
}

export interface DashboardStats {
  totalParts: number
  totalStockIn: number
  totalStockOut: number
  totalTransactions: number
  lowStockCount: number
  openJobs: number
  inProgressJobs: number
  completedToday: number
}

export interface AggregatedStockOutEntry {
  partNumber: string
  partName: string
  totalQuantity: number
  date: string
}

export interface AggregatedStockOutReport {
  date: string
  entries: AggregatedStockOutEntry[]
  dailyTotal: number
}

export type UserRole = "ROLE_ADMIN" | "ROLE_STOREKEEPER" | "ROLE_MECHANIC" | "ROLE_RECEPTIONIST"

export type JobCardStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

export interface JobCard {
  id: number
  jobNumber: string
  customerName: string
  customerPhone: string | null
  vehicleRegistration: string | null
  vehicleModel: string | null
  requestedWork: string | null
  technicalReport: string | null
  workCompleted: string | null
  status: JobCardStatus
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface JobCardRequest {
  customerName: string
  customerPhone?: string
  vehicleRegistration?: string
  vehicleModel?: string
  requestedWork?: string
}

export interface JobCardPart {
  id: number
  jobCardId: number
  partId: number
  partNumber: string
  partName: string
  unit: string
  quantity: number
  createdAt: string
}

export interface AddPartRequest {
  partId: number
  quantity: number
}
