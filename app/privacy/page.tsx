import Link from "next/link"
import { Instrument_Serif } from "next/font/google"

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: ["400"] })

export const metadata = {
  title: "Privacy Policy | cucina labs",
  description: "Privacy policy for cucina labs newsletter",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Still */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center grayscale"
            style={{ backgroundImage: "url('/video-background-2-still.png')" }}
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white py-3 px-4 sm:py-4 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
              <Link href="/">
                <h1 style={{ fontFamily: 'Arial, sans-serif' }} className="text-lg sm:text-xl text-black">
                  cucina <span className="font-bold">labs</span>
                </h1>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
            <div className="w-full max-w-4xl">
              {/* Privacy Policy Card */}
              <div className="rounded-[var(--radius-2xl)] border border-white/15 bg-[#0d0d0d]/56 p-6 sm:p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                <div className="mb-6 sm:mb-8">
                  <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 leading-[1.15] tracking-[-0.03em]`}>
                    Privacy Policy
                  </h1>
                  <p className="text-sm sm:text-base text-white/70">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="prose prose-invert max-w-none space-y-6 text-white/80">
                  <section>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Introduction</h2>
                    <p className="text-sm sm:text-base leading-relaxed">
                      Welcome to cucina <span className="font-bold">labs</span>. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you subscribe to our newsletter.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Information We Collect</h2>
                    <p className="text-sm sm:text-base leading-relaxed mb-3">
                      When you subscribe to our newsletter, we collect:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm sm:text-base">
                      <li>Your email address</li>
                      <li>Subscription date and time</li>
                      <li>Email engagement data (opens, clicks)</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">How We Use Your Information</h2>
                    <p className="text-sm sm:text-base leading-relaxed mb-3">
                      We use your information to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm sm:text-base">
                      <li>Send you our AI Product Briefing newsletter</li>
                      <li>Improve our content based on engagement metrics</li>
                      <li>Comply with legal obligations</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Data Sharing</h2>
                    <p className="text-sm sm:text-base leading-relaxed">
                      We do not sell, trade, or rent your personal information to third parties. We use Resend as our email service provider to deliver our newsletter. Your email address is stored securely in their system in accordance with their privacy policy.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Your Rights</h2>
                    <p className="text-sm sm:text-base leading-relaxed mb-3">
                      You have the right to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm sm:text-base">
                      <li>Unsubscribe from our newsletter at any time using the link in each email</li>
                      <li>Request access to your personal data</li>
                      <li>Request deletion of your personal data</li>
                      <li>Object to processing of your personal data</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Data Security</h2>
                    <p className="text-sm sm:text-base leading-relaxed">
                      We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Cookies</h2>
                    <p className="text-sm sm:text-base leading-relaxed">
                      Our website uses minimal cookies necessary for basic functionality. We do not use tracking cookies or third-party analytics.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Changes to This Policy</h2>
                    <p className="text-sm sm:text-base leading-relaxed">
                      We may update this Privacy Policy from time to time. We will notify subscribers of any material changes by email.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Contact Us</h2>
                    <p className="text-sm sm:text-base leading-relaxed">
                      If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us at the admin email address.
                    </p>
                  </section>
                </div>

                {/* Back link */}
                <p className="text-center mt-8">
                  <Link href="/" className="text-white/60 hover:text-[color:var(--accent-primary)] text-sm transition-colors">
                    ← Back to home
                  </Link>
                </p>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="relative z-10 py-4 px-4 sm:py-6 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <p className="text-white/60 text-xs sm:text-sm">
                © {new Date().getFullYear()} cucina <span className="font-bold">labs</span>
              </p>
              <Link href="/" className="text-white/60 hover:text-[color:var(--accent-primary)] text-xs sm:text-sm transition-colors">
                Home
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
