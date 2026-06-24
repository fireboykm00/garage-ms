"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--popover-foreground)",
          "--error-border": "hsl(0 84% 60%)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--popover-foreground)",
          "--success-border": "hsl(142 71% 45%)",
          "--warning-bg": "var(--popover)",
          "--warning-text": "var(--popover-foreground)",
          "--warning-border": "hsl(38 92% 50%)",
          "--info-bg": "var(--popover)",
          "--info-text": "var(--popover-foreground)",
          "--info-border": "hsl(200 98% 39%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!bg-popover !text-popover-foreground !border !shadow-sm",
          error: "!border-l-[3px] !border-l-red-500",
          success: "!border-l-[3px] !border-l-green-500",
          warning: "!border-l-[3px] !border-l-amber-500",
          info: "!border-l-[3px] !border-l-sky-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
