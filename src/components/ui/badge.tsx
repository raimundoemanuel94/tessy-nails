import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-3 py-0.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
        secondary:
          "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20",
        outline:
          "border-brand-accent/30 text-brand-text-sub bg-transparent",
        ghost:
          "hover:bg-brand-accent/5 hover:text-brand-primary",
        link: "text-brand-primary underline-offset-4 hover:underline",
        success: "bg-success/10 text-success border-success/20",
        warning: "bg-warning/10 text-warning border-warning/20",
        neutral: "bg-neutral-status/10 text-neutral-status border-neutral-status/20",
        highlight: "bg-highlight/10 text-highlight border-highlight/20",
      },
      size: {
        default: "h-6 px-3",
        xs: "h-5 px-2 text-[9px]",
        lg: "h-8 px-4 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props
    ),
    state: {
      slot: "badge",
      variant,
      size,
    },
    render,
  })
}

export { Badge, badgeVariants }
