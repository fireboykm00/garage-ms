import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Wrench, Package, ArrowDownToLine, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

const mainTabs = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: Wrench },
  { to: "/parts", label: "Parts", icon: Package },
  { to: "/stock/in", label: "Stock In", icon: ArrowDownToLine },
]

const moreItems = [
  { to: "/jobs/new", label: "New Job Card" },
  { to: "/reports/stock-out", label: "Stock Out Report" },
  { to: "/reports/remaining-stock", label: "Remaining Stock" },
]

export function MobileNav() {
  const location = useLocation()
  const { isAdmin } = useAuth()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
      <nav className="flex items-center justify-around h-14 px-2">
        {mainTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors rounded-md",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          )
        })}

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground h-auto"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-8">
            <SheetHeader>
              <SheetTitle className="text-left text-base">More Options</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-1">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  to="/admin/users"
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    location.pathname === "/admin/users"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  Users
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}
