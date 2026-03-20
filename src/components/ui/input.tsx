import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border border-brand-accent/20 bg-white px-4 py-2 text-base font-medium text-brand-text-main transition-all outline-none placeholder:text-brand-text-sub/50 focus-visible:border-brand-primary focus-visible:ring-4 focus-visible:ring-brand-primary/5 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-brand-soft/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
