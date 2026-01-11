"use client"

import { useState } from "react"
import { SignUpForm } from "@/components/signup-form"
import { Instrument_Serif } from "next/font/google"

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: ["400"] })

export function HomeCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      id: 0,
      badge: "AI PRODUCT BRIEFING",
      title: (
        <>
          The newsletter for{" "}
          <span className="bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-tertiary)] bg-clip-text text-transparent">
            AI Builders
          </span>
        </>
      ),
      content: (
        <>
          <p className="text-base sm:text-lg md:text-xl text-white/75 mb-6 sm:mb-8 md:mb-12 leading-relaxed max-w-xl">
            Fresh recipes, emerging trends, and the latest
            developments in artificial intelligence — served straight to
            your inbox.
          </p>
          <SignUpForm />
          <p className="text-xs sm:text-sm text-white/55 mt-4 sm:mt-6">
            Join the lab. <span className="text-[var(--accent-primary)]">Get the recipes first.</span>
          </p>
        </>
      ),
    },
    {
      id: 1,
      badge: "",
      title: (
        <>
          What is{" "}
          <span className="bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-tertiary)] bg-clip-text text-transparent">
            cucina labs
          </span>
          ?
        </>
      ),
      content: (
        <p className="text-lg md:text-xl text-white/75 leading-relaxed">
          <span className="bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-tertiary)] bg-clip-text text-transparent">
            cucina labs
          </span>{" "}
          is an AI test kitchen for builders. We experiment with emerging AI technologies, push them into real-world workflows, and document what actually works.
        </p>
      ),
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div className="relative w-full flex justify-center px-4 sm:px-6">
      {/* Card Container */}
      <div className="w-full max-w-[768px] rounded-[var(--radius-2xl)] border border-white/15 bg-[#0d0d0d]/56 p-6 sm:p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-28 right-0 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(74,95,217,0.25)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(155,242,202,0.2)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

        {/* Slide Content */}
        <div className="relative z-10 min-h-[400px] sm:min-h-[380px] md:h-[350px]">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`transition-opacity duration-500 h-full ${
                currentSlide === index ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
              }`}
            >
              {slide.badge && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(60,53,242,0.4)] bg-[linear-gradient(135deg,rgba(60,53,242,0.18),rgba(74,95,217,0.18))] px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--accent-primary)] mb-4 sm:mb-6">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  {slide.badge}
                </div>
              )}
              {!slide.badge && <div className="mb-4 sm:mb-6 h-[38px] sm:h-[42px]" />}

              <h1 className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-white mb-4 sm:mb-6 leading-[1.15] tracking-[-0.03em] pt-1`}>
                {slide.title}
              </h1>

              <div>{slide.content}</div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="relative z-10 flex items-center justify-between mt-6 sm:mt-8">
          <button
            onClick={prevSlide}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-300 hover:-translate-x-0.5 shrink-0"
            aria-label="Previous slide"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === index
                    ? "w-6 sm:w-8 h-2 bg-[var(--accent-primary)]"
                    : "w-2 h-2 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-300 hover:translate-x-0.5 shrink-0"
            aria-label="Next slide"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
