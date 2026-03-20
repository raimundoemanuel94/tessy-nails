"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-black uppercase tracking-widest transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand-primary text-white shadow-premium hover:shadow-premium-hover hover:opacity-90",
        outline:
          "border-brand-accent/20 bg-transparent text-brand-primary hover:bg-brand-accent/5",
        secondary:
          "bg-brand-secondary text-white shadow-premium hover:shadow-premium-hover",
        ghost:
          "text-brand-text-sub hover:bg-brand-accent/5 hover:text-brand-primary",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-brand-primary underline-offset-4 hover:underline",
        premium: "bg-linear-to-br from-brand-primary to-brand-secondary text-white shadow-premium-xl active:scale-95",
      },
      size: {
        default: "h-11 gap-2 px-6",
        xs: "h-7 gap-1 px-3 text-[10px]",
        sm: "h-9 gap-1.5 px-4 text-xs",
        lg: "h-14 gap-2.5 px-8 text-base",
        icon: "size-11",
        "icon-xs": "size-7",
        "icon-sm": "size-9",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
