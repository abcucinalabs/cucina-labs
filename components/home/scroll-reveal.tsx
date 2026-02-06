"use client"

import React, { useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

const defaultTitleClass =
  "text-2xl md:text-3xl font-semibold mb-2 text-foreground"
const defaultDescriptionClass =
  "text-base md:text-lg font-medium mb-2 text-muted-foreground max-w-[400px] leading-relaxed"
const imageClass =
  "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 grayscale"

export interface ItemContent {
  title: string
  description: string
  image: {
    url: string
    width: number
    height: number
    alt: string
  }
}

interface Props extends React.ComponentProps<"div"> {
  contentA: ItemContent
  contentB: ItemContent
  contentC: ItemContent
}

export default function ScrollRevealContent({
  contentA,
  contentB,
  contentC,
  className,
  ...props
}: Props) {
  const [scrollProgress, setScrollProgress] = React.useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const totalHeight = containerRef.current.scrollHeight - window.innerHeight
    const scrolled = -rect.top
    const progress = Math.max(0, Math.min(1, scrolled / totalHeight))
    console.log("[v0] scroll progress:", progress, "rect.top:", rect.top, "totalHeight:", totalHeight)
    setScrollProgress(progress)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <div className={cn("relative bg-background", className)} ref={containerRef} {...props}>
      {/* This tall container enables the scroll-driven animation */}
      <div className="h-[300vh]">
        <div
          className="sticky top-0 flex h-screen w-full items-center"
        >
          <div className="mx-auto flex w-full max-w-[1340px] flex-row gap-16 px-6 md:gap-24 lg:gap-32 lg:px-12 xl:gap-40">
            <div className="flex w-full flex-col justify-center gap-10 lg:w-1/2">
              <PointItem
                number="01"
                title={contentA.title}
                description={contentA.description}
                thresholdStart={0}
                thresholdEnd={0.33}
                scrollProgress={scrollProgress}
              />
              <PointItem
                number="02"
                title={contentB.title}
                description={contentB.description}
                thresholdStart={0.33}
                thresholdEnd={0.66}
                scrollProgress={scrollProgress}
              />
              <PointItem
                number="03"
                title={contentC.title}
                description={contentC.description}
                thresholdStart={0.66}
                thresholdEnd={1}
                scrollProgress={scrollProgress}
              />
            </div>
            <div className="relative hidden h-[70vh] w-1/2 items-center justify-center overflow-hidden rounded-2xl lg:flex">
              <Image
                width={contentA.image.width}
                height={contentA.image.height}
                src={contentA.image.url}
                alt={contentA.image.alt}
                className={cn(
                  imageClass,
                  scrollProgress > -1 ? "opacity-100" : "opacity-0"
                )}
              />
              <Image
                width={contentB.image.width}
                height={contentB.image.height}
                src={contentB.image.url}
                alt={contentB.image.alt}
                className={cn(
                  imageClass,
                  scrollProgress > 0.33 ? "opacity-100" : "opacity-0"
                )}
              />
              <Image
                width={contentC.image.width}
                height={contentC.image.height}
                src={contentC.image.url}
                alt={contentC.image.alt}
                className={cn(
                  imageClass,
                  scrollProgress > 0.66 ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getBarPercentageHeight = (
  scrollProgress: number,
  thresholdStart: number,
  thresholdEnd: number
) => {
  if (scrollProgress < thresholdStart) return 0
  if (scrollProgress > thresholdEnd) return 100
  return (
    ((scrollProgress - thresholdStart) / (thresholdEnd - thresholdStart)) * 100
  )
}

function PointItem({
  number,
  title,
  description,
  thresholdStart,
  thresholdEnd,
  scrollProgress,
}: {
  number: string
  title: string
  description: string
  thresholdStart: number
  thresholdEnd: number
  scrollProgress: number
}) {
  const barHeightPercentage = getBarPercentageHeight(
    scrollProgress,
    thresholdStart,
    thresholdEnd
  )
  const isActive = barHeightPercentage > 0

  return (
    <div className="interactive flex w-full flex-col">
      <div className="w-full">
        <h3
          className={cn(
            "mb-4 ml-5 text-sm font-medium uppercase tracking-widest transition-opacity duration-300",
            isActive ? "text-foreground opacity-100" : "text-muted-foreground opacity-50"
          )}
        >
          {number}
        </h3>
      </div>
      <div className="relative left-4 flex w-full">
        <div className="relative flex w-[70px] items-start justify-center">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" />
          <div
            className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-foreground transition-all duration-150"
            style={{ height: `${barHeightPercentage}%` }}
          />
        </div>
        <div className="pl-4">
          <div className="flex flex-col gap-1">
            <h3
              className={cn(
                defaultTitleClass,
                "transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-50"
              )}
            >
              {title}
            </h3>
            <p
              className={cn(
                defaultDescriptionClass,
                "transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-50"
              )}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
