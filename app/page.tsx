import { HomeCarousel } from "@/components/home-carousel"

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Still */}
        <div
          className="absolute inset-0 bg-cover bg-center grayscale"
          style={{ backgroundImage: "url('/video-background-2-still.png')" }}
        />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white py-3 px-4 sm:py-4 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
              <h1 style={{ fontFamily: 'Arial, sans-serif' }} className="text-lg sm:text-xl text-black">
                cucina <span className="font-bold">labs</span>
              </h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex items-center">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-20">
              <HomeCarousel />
            </div>
          </main>

          {/* Footer */}
          <footer className="relative z-10 py-4 px-4 sm:py-6 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <p className="text-white/60 text-xs sm:text-sm">
                © {new Date().getFullYear()} cucina <span className="font-bold">labs</span>
              </p>
              <a
                href="/login"
                className="text-white/60 hover:text-[color:var(--accent-primary)] text-xs sm:text-sm transition-colors"
              >
                Admin
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
