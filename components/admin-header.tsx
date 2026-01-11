"use client"

export function AdminHeader({ email }: { email: string }) {
  return (
    <header className="h-16 border-b border-[var(--border-default)] bg-white/80 backdrop-blur-xl">
      <div className="h-full flex items-center justify-between px-12">
        <h1 className="text-xl text-black">
          cucina <span className="font-bold">labs</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[color:var(--text-secondary)] px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)]">
            {email}
          </span>
        </div>
      </div>
    </header>
  )
}
