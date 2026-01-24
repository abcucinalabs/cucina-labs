import type { Metadata } from "next"
import { Instrument_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { PwaRegister } from "@/components/pwa-register"

const instrumentSans = Instrument_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "cucina labs",
  description: "Curated AI product content for builders",
  manifest: "/manifest.webmanifest",
  themeColor: "#0d0d0d",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Cucina Admin",
    statusBarStyle: "black-translucent",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={instrumentSans.className}>
        <div className="ambient-glow--green" />
        <div className="ambient-glow--purple" />
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
        <PwaRegister />
      </body>
    </html>
  )
}
