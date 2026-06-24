import { Link } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

interface BreadcrumbSegment {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[]
}

export function Breadcrumbs({ segments }: BreadcrumbsProps) {
  return (
    <Breadcrumb className="mb-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Garage</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((seg, i) => (
          <BreadcrumbItem key={seg.label + i}>
            <BreadcrumbSeparator />
            {i === segments.length - 1 || !seg.href ? (
              <BreadcrumbPage>{seg.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={seg.href}>{seg.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
