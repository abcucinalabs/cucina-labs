"use client"

export function AdminHeader({ email }: { email: string }) {
  return (
    <header className="h-16 border-b border-[var(--border-default)] bg-white/80 backdrop-blur-xl">
      <div className="h-full flex items-center px-12">
        <h1 className="text-xl text-black">
          cucina <span className="font-bold">labs</span>
        </h1>
      </div>
    </header>
  )
}
