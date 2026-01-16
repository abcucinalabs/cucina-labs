"use client"

import { cn } from "@/lib/utils"

export function ToggleButton({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  color?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[#3c35f2] text-white"
          : "bg-[var(--bg-muted)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-muted-hover)]"
      )}
    >
      {color && (
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  )
}
