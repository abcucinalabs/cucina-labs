const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

export interface ScheduleRules {
  timeFrameHours: number
  timeFrameLabel: string
  schedulePattern: "daily" | "weekdays" | "weekly" | "custom"
  dayExplanation: string
}

/**
 * Given the selected days and the current day of the week,
 * compute how many hours to look back for articles by finding
 * the gap to the previous selected day.
 */
export function computeTimeFrameHours(
  selectedDays: string[],
  currentDay: string
): number {
  if (selectedDays.length === 0) return 24

  const currentIdx = DAY_ORDER.indexOf(currentDay.toLowerCase())
  if (currentIdx === -1) return 24

  const selectedIndices = selectedDays
    .map(d => DAY_ORDER.indexOf(d.toLowerCase()))
    .filter(i => i !== -1)
    .sort((a, b) => a - b)

  if (selectedIndices.length === 0) return 24

  // Find the previous selected day by walking backwards
  let prevIdx = -1
  for (let offset = 1; offset <= 7; offset++) {
    const candidate = (currentIdx - offset + 7) % 7
    if (selectedIndices.includes(candidate)) {
      prevIdx = candidate
      break
    }
  }

  if (prevIdx === -1) return 24

  const gap = (currentIdx - prevIdx + 7) % 7
  return gap * 24
}

/**
 * Compute human-readable rules for display in the wizard.
 */
export function computeScheduleRules(selectedDays: string[]): ScheduleRules {
  if (selectedDays.length === 0) {
    return {
      timeFrameHours: 24,
      timeFrameLabel: "past 24 hours",
      schedulePattern: "daily",
      dayExplanation: "No days selected. Defaults to daily with 24-hour lookback.",
    }
  }

  if (selectedDays.length === 7) {
    return {
      timeFrameHours: 24,
      timeFrameLabel: "past 24 hours (72 hours on Mondays)",
      schedulePattern: "daily",
      dayExplanation: "Daily schedule: articles from the past 24 hours. On Monday, covers the weekend (72 hours).",
    }
  }

  const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"]
  const isWeekdays = selectedDays.length === 5 && weekdays.every(d => selectedDays.includes(d))

  if (isWeekdays) {
    return {
      timeFrameHours: 24,
      timeFrameLabel: "past 24 hours (72 hours on Mondays)",
      schedulePattern: "weekdays",
      dayExplanation: "Weekday schedule: articles from the past 24 hours. On Monday, covers Sat + Sun + Mon (72 hours).",
    }
  }

  if (selectedDays.length === 1) {
    return {
      timeFrameHours: 168,
      timeFrameLabel: "past 7 days",
      schedulePattern: "weekly",
      dayExplanation: `Weekly on ${capitalize(selectedDays[0])}: articles from the entire past week (168 hours).`,
    }
  }

  // Custom pattern — compute per-day breakdown
  const perDayHours = selectedDays.map(day => computeTimeFrameHours(selectedDays, day))
  const maxHours = Math.max(...perDayHours)
  const perDayBreakdown = selectedDays.map((day, i) => `${capitalize(day)}: ${perDayHours[i]}h`)

  return {
    timeFrameHours: maxHours,
    timeFrameLabel: `varies by day (up to ${maxHours} hours)`,
    schedulePattern: "custom",
    dayExplanation: `Custom schedule. Lookback per day: ${perDayBreakdown.join(", ")}.`,
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
