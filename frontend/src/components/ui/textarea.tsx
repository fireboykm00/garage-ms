import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[80px] w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm transition-colors outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 dark:bg-input/20 dark:disabled:bg-muted/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
