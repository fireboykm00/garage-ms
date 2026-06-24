import { useState } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, AlertCircle } from "lucide-react"
import { AxiosError } from "axios"

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Client-side field validation
    const errors: { username?: string; password?: string } = {}
    if (!username.trim()) errors.username = "Username is required"
    if (!password.trim()) errors.password = "Password is required"
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    try {
      await login({ username, password })
      navigate("/dashboard")
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        const msg = err.response.data.message as string
        if (msg.toLowerCase().includes("bad credentials") || msg.toLowerCase().includes("invalid credentials")) {
          setError("Invalid username or password")
        } else {
          setError(msg)
        }
      } else if (err instanceof AxiosError && !err.response) {
        setError("Connection failed. Make sure the server is running.")
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
    setFieldErrors({})
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Garage Inventory</CardTitle>
          <CardDescription>Sign in to manage your garage stock</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username}
                onChange={(e) => { setUsername(e.target.value); setFieldErrors((prev) => ({ ...prev, username: undefined })) }}
                required className={fieldErrors.username ? "border-destructive" : ""} />
              {fieldErrors.username && (
                <p className="text-xs text-destructive">{fieldErrors.username}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })) }}
                required className={fieldErrors.password ? "border-destructive" : ""} />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 rounded-md bg-muted p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Demo Credentials</p>
            <div className="space-y-1 text-xs">
              <button type="button" className="block w-full text-left hover:text-primary" onClick={() => fillDemo("admin", "admin123")}>
                Admin: <code className="rounded bg-background px-1">admin / admin123</code>
              </button>
              <button type="button" className="block w-full text-left hover:text-primary" onClick={() => fillDemo("storekeeper", "storekeeper123")}>
                Storekeeper: <code className="rounded bg-background px-1">storekeeper / storekeeper123</code>
              </button>
              <button type="button" className="block w-full text-left hover:text-primary" onClick={() => fillDemo("mechanic", "mechanic123")}>
                Mechanic: <code className="rounded bg-background px-1">mechanic / mechanic123</code>
              </button>
              <button type="button" className="block w-full text-left hover:text-primary" onClick={() => fillDemo("receptionist", "receptionist123")}>
                Receptionist: <code className="rounded bg-background px-1">receptionist / receptionist123</code>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
