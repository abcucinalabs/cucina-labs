"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type ChartDataPoint = {
  date: string
  emails?: number
  openRate?: number
  clickRate?: number
}

type MetricKey = "emails" | "openRate" | "clickRate"

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; unit: string }> = {
  emails: { label: "Total Emails", color: "#3c35f2", unit: "" },
  openRate: { label: "Open Rate", color: "#a5b4fc", unit: "%" },
  clickRate: { label: "Click Rate", color: "#d4d4d8", unit: "%" },
}

export function PerformanceChart({
  data,
  selectedMetrics,
}: {
  data: ChartDataPoint[]
  selectedMetrics: MetricKey[]
}) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-[color:var(--text-secondary)]">
        No performance data available for this period.
      </div>
    )
  }

  const formatXAxis = (value: string) => {
    const date = new Date(value)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatTooltipValue = (value: number | undefined, name: string | undefined) => {
    if (value === undefined) return ""
    if (!name) return value.toLocaleString()
    const metricKey = Object.keys(METRIC_CONFIG).find(
      (key) => METRIC_CONFIG[key as MetricKey].label === name
    ) as MetricKey | undefined
    if (metricKey && METRIC_CONFIG[metricKey].unit === "%") {
      return `${value.toFixed(1)}%`
    }
    return value.toLocaleString()
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxis}
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
          axisLine={{ stroke: "var(--border-default)" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
          axisLine={{ stroke: "var(--border-default)" }}
        />
        <Tooltip
          formatter={formatTooltipValue}
          labelFormatter={(label) =>
            new Date(label).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          }
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend />
        {selectedMetrics.includes("emails") && (
          <Line
            type="monotone"
            dataKey="emails"
            name={METRIC_CONFIG.emails.label}
            stroke={METRIC_CONFIG.emails.color}
            strokeWidth={2}
            dot={{ fill: METRIC_CONFIG.emails.color, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        )}
        {selectedMetrics.includes("openRate") && (
          <Line
            type="monotone"
            dataKey="openRate"
            name={METRIC_CONFIG.openRate.label}
            stroke={METRIC_CONFIG.openRate.color}
            strokeWidth={2}
            dot={{ fill: METRIC_CONFIG.openRate.color, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        )}
        {selectedMetrics.includes("clickRate") && (
          <Line
            type="monotone"
            dataKey="clickRate"
            name={METRIC_CONFIG.clickRate.label}
            stroke={METRIC_CONFIG.clickRate.color}
            strokeWidth={2}
            dot={{ fill: METRIC_CONFIG.clickRate.color, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

export type { ChartDataPoint, MetricKey }
