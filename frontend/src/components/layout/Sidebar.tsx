import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard, Package, ArrowDownToLine,
  FileText, ClipboardList, Users, Menu, X, LogOut, ChevronDown,
  Wrench
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const adminNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Job Cards", icon: Wrench },
  { to: "/parts", label: "Parts", icon: Package },
  { to: "/stock/in", label: "Stock In", icon: ArrowDownToLine },
  { to: "/reports/stock-out", label: "Stock Out Report", icon: FileText },
  { to: "/reports/remaining-stock", label: "Remaining Stock", icon: ClipboardList },
  { to: "/admin/users", label: "Users", icon: Users },
]

const storekeeperNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Job Cards", icon: Wrench },
  { to: "/parts", label: "Parts", icon: Package },
  { to: "/stock/in", label: "Stock In", icon: ArrowDownToLine },
  { to: "/reports/stock-out", label: "Stock Out Report", icon: FileText },
  { to: "/reports/remaining-stock", label: "Remaining Stock", icon: ClipboardList },
]

const managerNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Job Cards", icon: Wrench },
  { to: "/reports/stock-out", label: "Stock Out Report", icon: FileText },
  { to: "/reports/remaining-stock", label: "Remaining Stock", icon: ClipboardList },
]

const mechanicNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Job Cards", icon: Wrench },
  { to: "/parts", label: "Parts", icon: Package },
  { to: "/reports/stock-out", label: "Stock Out Report", icon: FileText },
  { to: "/reports/remaining-stock", label: "Remaining Stock", icon: ClipboardList },
]

const receptionistNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Job Cards", icon: Wrench },
]

function NavContent({ navItems, location, onNavClick }: {
  navItems: typeof adminNavItems
  location: ReturnType<typeof useLocation>
  onNavClick: () => void
}) {
  return (
    <nav className="flex-1 space-y-1 p-3">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/")
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  const { user, isAdmin, isStorekeeper, isMechanic, isReceptionist, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  let navItems = managerNavItems
  if (isAdmin) navItems = adminNavItems
  else if (isStorekeeper) navItems = storekeeperNavItems
  else if (isMechanic) navItems = mechanicNavItems
  else if (isReceptionist) navItems = receptionistNavItems

  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <Wrench className="h-5 w-5" />
          <span>Garage</span>
        </div>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-medium">{user?.fullName}</div>
              <div className="px-2 py-0.5 text-xs text-muted-foreground">{user?.role?.replace("ROLE_", "")}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Wrench className="h-5 w-5" />
          <span className="font-semibold">Garage Inventory</span>
        </div>
        <NavContent navItems={navItems} location={location} onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-background lg:z-30">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Wrench className="h-5 w-5 text-primary" />
          <span className="font-semibold">Garage Inventory</span>
        </div>
        <NavContent navItems={navItems} location={location} onNavClick={() => {}} />
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">{user?.role?.replace("ROLE_", "")}</span>
                </div>
                <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}
