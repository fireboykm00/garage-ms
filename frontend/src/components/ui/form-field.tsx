import { Label } from "@/components/ui/label"
import type { ReactNode } from "react"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className || ""}`}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
