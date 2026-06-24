import { useEffect, useState, useMemo } from "react"
import { userService } from "@/services/userService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { Plus, Trash2, Users, Search, Edit, Clock, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { User, UserRole } from "@/types"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import axios from "axios"

export function AdminUsersPage() {
  useDocumentTitle("Users")
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogUser, setDeleteDialogUser] = useState<User | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [saving, setSaving] = useState(false)
  const [savingUpdate, setSavingUpdate] = useState(false)
  const [savingDelete, setSavingDelete] = useState(false)
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "ROLE_STOREKEEPER" as UserRole,
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const res = await userService.getAll()
      setUsers(res.data)
      setLoadError(false)
    } catch {
      toast.error("Failed to load users")
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.replace("ROLE_", "").toLowerCase().includes(q)
    )
  }, [users, search])

  const openCreate = () => {
    setEditingUser(null)
    setCreateFieldErrors({})
    setFormData({
      username: "",
      email: "",
      password: "",
      fullName: "",
      role: "ROLE_STOREKEEPER",
    })
    setDialogOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: "",
      role: user.role as UserRole,
    })
    setEditDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await userService.create(formData)
      toast.success("User created")
      setDialogOpen(false)
      loadUsers()
    } catch (err: unknown) {
      const knownFieldNames = ["username", "email", "fullName", "password"];
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, string>;
        const hasFieldErrors = Object.keys(data).some((k) => knownFieldNames.includes(k));
        if (hasFieldErrors) {
          setCreateFieldErrors(data);
        } else if (data.message) {
          toast.error(data.message);
        } else {
          toast.error("Failed to create user");
        }
      } else {
        toast.error("Failed to create user");
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setSavingUpdate(true)
    try {
      await userService.updateRole(editingUser.id, formData.role)
      toast.success("User updated")
      setEditDialogOpen(false)
      loadUsers()
    } catch {
      toast.error("Failed to update user")
    } finally {
      setSavingUpdate(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialogUser) return
    setSavingDelete(true)
    try {
      await userService.delete(deleteDialogUser.id)
      toast.success("User deleted")
      setDeleteDialogUser(null)
      setDeleteConfirmText("")
      loadUsers()
    } catch {
      toast.error("Failed to delete user")
    } finally {
      setSavingDelete(false)
    }
  }

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "ROLE_ADMIN": return "default"
      case "ROLE_STOREKEEPER": return "secondary"
      case "ROLE_MECHANIC": return "default"
      case "ROLE_RECEPTIONIST": return "secondary"
      default: return "secondary"
    }
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case "ROLE_ADMIN": return "Admin"
      case "ROLE_STOREKEEPER": return "Storekeeper"
      case "ROLE_MECHANIC": return "Mechanic"
      case "ROLE_RECEPTIONIST": return "Receptionist"
      default: return role.replace("ROLE_", "")
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"
  }

  const getLastActive = (user: User) => {
    if (!user.createdAt) return "Never logged in"
    const diff = Date.now() - new Date(user.createdAt).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return "Less than an hour ago"
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Use cards if <= 10 users, otherwise table
  const useCards = filteredUsers.length <= 10

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ label: "Admin", href: "#" }, { label: "Users" }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setCreateFieldErrors({}); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" value={formData.username} onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setCreateFieldErrors((prev) => { const next = { ...prev }; delete next.username; return next; }); }} required placeholder="Username" className={createFieldErrors.username ? "border-destructive" : ""} />
                {createFieldErrors.username && <p className="text-xs text-destructive">{createFieldErrors.username}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setCreateFieldErrors((prev) => { const next = { ...prev }; delete next.email; return next; }); }} required placeholder="Email" className={createFieldErrors.email ? "border-destructive" : ""} />
                {createFieldErrors.email && <p className="text-xs text-destructive">{createFieldErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={formData.fullName} onChange={(e) => { setFormData({ ...formData, fullName: e.target.value }); setCreateFieldErrors((prev) => { const next = { ...prev }; delete next.fullName; return next; }); }} required placeholder="Full name" className={createFieldErrors.fullName ? "border-destructive" : ""} />
                {createFieldErrors.fullName && <p className="text-xs text-destructive">{createFieldErrors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setCreateFieldErrors((prev) => { const next = { ...prev }; delete next.password; return next; }); }} required placeholder="Password" className={createFieldErrors.password ? "border-destructive" : ""} />
                {createFieldErrors.password && <p className="text-xs text-destructive">{createFieldErrors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROLE_STOREKEEPER">Storekeeper</SelectItem>
                    <SelectItem value="ROLE_MECHANIC">Mechanic</SelectItem>
                    <SelectItem value="ROLE_RECEPTIONIST">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">Failed to load users</span>
          <Button variant="outline" size="sm" onClick={loadUsers}>
            Retry
          </Button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by username, name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {useCards ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{user.fullName}</h3>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                    <div className="mt-1">
                      <Badge variant={roleBadgeVariant(user.role)} className="text-xs">
                        {roleLabel(user.role)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last active: {getLastActive(user)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(user)} disabled={user.id === currentUser?.id}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <AlertDialog
                    open={deleteDialogUser?.id === user.id}
                    onOpenChange={(open) => {
                      if (!open) { setDeleteDialogUser(null); setDeleteConfirmText("") }
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        disabled={user.id === currentUser?.id}
                        onClick={() => { setDeleteDialogUser(user); setDeleteConfirmText("") }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. To confirm, type <strong>{user.username}</strong> below.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-2">
                        <Input
                          placeholder={`Type "${user.username}" to confirm`}
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteDialogUser(null); setDeleteConfirmText("") }}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={deleteConfirmText !== user.username || savingDelete}
                          onClick={handleDelete}
                          className="bg-destructive"
                        >
                          {savingDelete ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">USERNAME</th>
                    <th className="pb-2 font-medium">NAME</th>
                    <th className="pb-2 font-medium">EMAIL</th>
                    <th className="pb-2 font-medium">ROLE</th>
                    <th className="pb-2 font-medium">CREATED</th>
                    <th className="pb-2 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No users found</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{user.username}</td>
                        <td className="py-2">{user.fullName}</td>
                        <td className="py-2 text-muted-foreground">{user.email}</td>
                        <td className="py-2">
                          <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(user)} disabled={user.id === currentUser?.id}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog
                              open={deleteDialogUser?.id === user.id}
                              onOpenChange={(open) => {
                                if (!open) { setDeleteDialogUser(null); setDeleteConfirmText("") }
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive" disabled={user.id === currentUser?.id}
                                  onClick={() => { setDeleteDialogUser(user); setDeleteConfirmText("") }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. To confirm, type <strong>{user.username}</strong> below.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-2">
                                  <Input
                                    placeholder={`Type "${user.username}" to confirm`}
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => { setDeleteDialogUser(null); setDeleteConfirmText("") }}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    disabled={deleteConfirmText !== user.username || savingDelete}
                                    onClick={handleDelete}
                                    className="bg-destructive"
                                  >
                                    {savingDelete ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User — {editingUser?.username}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.fullName} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE_STOREKEEPER">Storekeeper</SelectItem>
                  <SelectItem value="ROLE_MECHANIC">Mechanic</SelectItem>
                  <SelectItem value="ROLE_RECEPTIONIST">Receptionist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={savingUpdate}>{savingUpdate ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
