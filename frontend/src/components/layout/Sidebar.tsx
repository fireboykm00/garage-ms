import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { partService } from "@/services/partService"
import {
  LayoutDashboard, Package, ArrowDownToLine,
  FileText, ClipboardList, Users, Menu, X, LogOut, ChevronDown,
  Wrench, PlusCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
}

interface NavSection {
  label: string
  items: NavItem[]
  adminOnly?: boolean
}

const SeparatorLine = () => <Separator className="my-2" />

export function Sidebar() {
  const { user, isAdmin, isStorekeeper, isMechanic, isReceptionist, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)

  // Fetch low stock count
  useEffect(() => {
    if (isAdmin || isStorekeeper || isMechanic) {
      partService.getLowStock()
        .then((res) => setLowStockCount(res.data.length))
        .catch(() => {})
    }
  }, [location.pathname, isAdmin, isStorekeeper, isMechanic])

  const sections: NavSection[] = [
    {
      label: "Operations",
      items: [
        { to: "/jobs", label: "Job Cards", icon: Wrench },
        ...((isAdmin || isStorekeeper || isReceptionist)
          ? [{ to: "/jobs/new", label: "New Job Card", icon: PlusCircle }]
          : []),
      ],
    },
    {
      label: "Inventory",
      items: [
        ...((isAdmin || isStorekeeper || isMechanic)
          ? [{ to: "/stocks", label: "Stocks", icon: Package }]
          : []),
        ...((isAdmin || isStorekeeper)
          ? [{ to: "/stock/in", label: "Stock In", icon: ArrowDownToLine }]
          : []),
        ...((isAdmin || isStorekeeper)
          ? [{ to: "/parts/new", label: "Add Part", icon: PlusCircle }]
          : []),
      ],
    },
    {
      label: "Reports",
      items: [
        ...((isAdmin || isStorekeeper || isMechanic)
          ? [{ to: "/reports/stock-out", label: "Stock Out", icon: FileText }]
          : []),
        ...((isAdmin || isStorekeeper || isMechanic)
          ? [{ to: "/reports/remaining-stock", label: "Remaining Stock", icon: ClipboardList }]
          : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            label: "Admin",
            items: [{ to: "/admin/users", label: "Users", icon: Users }],
          } as NavSection,
        ]
      : []),
  ]

  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"

  const handleNavClick = () => {
    setMobileOpen(false)
  }

  function isActiveItem(to: string) {
    if (location.pathname === to) return true
    if (location.pathname.startsWith(to + "/")) {
      const isExactChild = sections.some((s) =>
        s.items.some((other) => other.to !== to && location.pathname === other.to)
      )
      return !isExactChild
    }
    return false
  }

  return (
    <>
      <div className="mobile-header fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <Wrench className="h-5 w-5" />
          <span>Garage</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
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
              <div className="px-2 py-0.5 text-xs text-muted-foreground">
                {user?.role?.replace("ROLE_", "")}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

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
        {renderNavContent()}
      </aside>

      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-background lg:z-30">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Wrench className="h-5 w-5 text-primary" />
          <span className="font-semibold">Garage Inventory</span>
        </div>
        {renderNavContent()}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.role?.replace("ROLE_", "")}
                  </span>
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

  function renderNavContent() {
    return (
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <NavLink
          to="/dashboard"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            location.pathname === "/dashboard"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
          Dashboard
        </NavLink>

        {sections.map((section) => (
          <div key={section.label}>
            <SeparatorLine />
            <div className="px-3 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </span>
            </div>
            {section.items.map((item) => {
              const Icon = item.icon
              const isStocksLink = item.to === "/stocks"
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActiveItem(item.to)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                  {isStocksLink && lowStockCount > 0 && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-red-500" title={`${lowStockCount} low stock items`} />
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    )
  }
}
