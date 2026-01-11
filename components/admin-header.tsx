"use client"

export function AdminHeader({ email }: { email: string }) {
  return (
    <header className="h-16 border-b border-[var(--border-default)] bg-white/80 backdrop-blur-xl">
      <div className="h-full flex items-center justify-end px-12">
        <span className="text-sm text-[color:var(--text-secondary)] px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)]">
          {email}
        </span>
      </div>
    </header>
  )
}
