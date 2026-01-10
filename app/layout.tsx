import type { Metadata } from "next"
import { Instrument_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const instrumentSans = Instrument_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Cucina Labs - AI Product Newsletter",
  description: "Curated AI product content for builders",
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
      </body>
    </html>
  )
}
