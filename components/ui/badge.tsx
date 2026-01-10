import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent-primary-light)] text-[color:var(--accent-primary-dark)]",
        secondary: "bg-[var(--bg-muted)] text-[color:var(--text-secondary)]",
        destructive: "border border-red-500/20 bg-red-500/10 text-red-700",
        outline: "border border-[var(--border-default)] text-[color:var(--text-muted)]",
        success:
          "border border-[rgba(155,242,202,0.7)] bg-[rgba(155,242,202,0.35)] text-[#0d0d0d]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
