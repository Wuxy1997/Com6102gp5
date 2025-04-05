"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, subDays, subMonths, subYears } from "date-fns"

type WeightTrendChartProps = {
  data: any[]
}

export function WeightTrendChart({ data }: WeightTrendChartProps) {
  const [timeFrame, setTimeFrame] = useState<"day" | "week" | "month" | "year">("month")
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([])
      return
    }

    // Sort data by date (oldest first)
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Filter data based on time frame
    const filteredData = filterDataByTimeFrame(sortedData, timeFrame)

    // Format data for chart
    const formattedData = filteredData.map((item) => ({
      date: format(new Date(item.date), "MMM dd, yyyy"),
      weight: item.weight,
      timestamp: new Date(item.date).getTime(), // Add timestamp for sorting
    }))

    setChartData(formattedData)

    // Log for debugging
    console.log(`Time frame: ${timeFrame}, Data points: ${formattedData.length}`)
    console.log("Filtered data:", filteredData)
  }, [data, timeFrame])

  const filterDataByTimeFrame = (data: any[], timeFrame: string) => {
    if (data.length === 0) return []

    const now = new Date()

    if (timeFrame === "day") {
      return data.filter((item) => {
        const itemDate = new Date(item.date)
        const today = new Date()
        return (
          itemDate.getDate() === today.getDate() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear()
        )
      })
    } else if (timeFrame === "week") {
      const oneWeekAgo = subDays(now, 7)
      return data.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= oneWeekAgo
      })
    } else if (timeFrame === "month") {
      const oneMonthAgo = subMonths(now, 1)
      return data.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= oneMonthAgo
      })
    } else if (timeFrame === "year") {
      const oneYearAgo = subYears(now, 1)
      return data.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= oneYearAgo
      })
    }

    // Default: return all data
    return data
  }

  // Calculate reasonable Y-axis domain based on data
  const calculateYAxisDomain = () => {
    if (chartData.length === 0) return [0, 100]

    // Find the minimum and maximum weight values
    const weights = chartData.map((item) => item.weight)
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)

    // Add 5% padding to top and bottom
    const padding = (maxWeight - minWeight) * 0.05

    // If min and max are the same (only one data point), add some range
    if (minWeight === maxWeight) {
      return [minWeight - 5, maxWeight + 5]
    }

    return [
      Math.max(0, Math.floor((minWeight - padding) / 5) * 5), // Round down to nearest 5
      Math.ceil((maxWeight + padding) / 5) * 5, // Round up to nearest 5
    ]
  }

  return (
    <div className="w-full">
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setTimeFrame("day")}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              timeFrame === "day"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted"
            } border border-border`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setTimeFrame("week")}
            className={`px-4 py-2 text-sm font-medium ${
              timeFrame === "week"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted"
            } border-t border-b border-r border-border`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setTimeFrame("month")}
            className={`px-4 py-2 text-sm font-medium ${
              timeFrame === "month"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted"
            } border-t border-b border-r border-border`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setTimeFrame("year")}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              timeFrame === "year"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted"
            } border-t border-b border-r border-border`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="h-[300px]">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No weight data available for the selected time period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
              <YAxis
                domain={calculateYAxisDomain()}
                label={{
                  value: "Weight (kg)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip formatter={(value) => [`${value} kg`, "Weight"]} labelFormatter={(label) => `Date: ${label}`} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

