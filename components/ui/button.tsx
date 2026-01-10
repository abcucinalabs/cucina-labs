import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-[rgba(13,13,13,0.12)] bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-sm hover:shadow-[var(--shadow-button)] hover:scale-[1.02] hover:brightness-95 active:scale-[0.98] active:brightness-90",
        destructive:
          "border border-red-500/20 bg-red-500/10 text-red-700 hover:bg-red-500/20",
        outline:
          "border border-[var(--border-default)] bg-transparent text-[color:var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[color:var(--text-primary)]",
        secondary:
          "bg-[var(--bg-subtle)] text-[color:var(--text-primary)] hover:bg-[var(--bg-muted)]",
        ghost:
          "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-muted)]",
        link: "text-[color:var(--accent-primary-dark)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-[var(--radius-sm)] px-4",
        lg: "h-12 rounded-[var(--radius-md)] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
    const loading = Boolean(isLoading)
    const isDisabled = Boolean(disabled || loading)

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }), loading && "button-loading")}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        data-loading={loading ? "true" : undefined}
        {...props}
      >
        <span className="button-content relative z-10 inline-flex items-center justify-center">
          {children}
        </span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
