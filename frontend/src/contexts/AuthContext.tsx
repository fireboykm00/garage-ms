import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService } from "@/services/authService"
import type { User, LoginRequest } from "@/types"
import { toast } from "sonner"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isStorekeeper: boolean
  isMechanic: boolean
  isReceptionist: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem("token"))

  useEffect(() => {
    if (!token) return
    authService
      .getMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        toast.error("Session expired. Please log in again.")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const login = async (data: LoginRequest) => {
    const res = await authService.login(data)
    const { token, ...userData } = res.data
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(userData))
    setToken(token)
    setUser(userData as unknown as User)
    toast.success(`Welcome back, ${userData.fullName}!`)
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
    toast.success("Logged out successfully")
  }

  const isAuthenticated = !!user && !!token
  const isAdmin = user?.role === "ROLE_ADMIN"
  const isStorekeeper = user?.role === "ROLE_STOREKEEPER"
  const isMechanic = user?.role === "ROLE_MECHANIC"
  const isReceptionist = user?.role === "ROLE_RECEPTIONIST"

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated, isAdmin, isStorekeeper, isMechanic, isReceptionist, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
