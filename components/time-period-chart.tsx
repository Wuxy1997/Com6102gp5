"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type TimePeriodsChartProps = {
  data: any[]
  dataKey: string
  label: string
  color: string
}

export function TimePeriodsChart({ data, dataKey, label, color }: TimePeriodsChartProps) {
  const [timeFrame, setTimeFrame] = useState<"day" | "week" | "month" | "year">("week")
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([])
      return
    }

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Group data by time frame
    const groupedData = groupDataByTimeFrame(sortedData, timeFrame)
    setChartData(groupedData)
  }, [data, timeFrame])

  const groupDataByTimeFrame = (data: any[], timeFrame: string) => {
    const now = new Date()
    const result: any[] = []
    const dateMap = new Map()

    // Filter data based on time frame
    const filteredData = data.filter((item) => {
      const itemDate = new Date(item.date)
      if (timeFrame === "day") {
        return (
          itemDate.getDate() === now.getDate() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        )
      } else if (timeFrame === "week") {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(now.getDate() - 7)
        return itemDate >= oneWeekAgo
      } else if (timeFrame === "month") {
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(now.getMonth() - 1)
        return itemDate >= oneMonthAgo
      } else if (timeFrame === "year") {
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(now.getFullYear() - 1)
        return itemDate >= oneYearAgo
      }
      return true
    })

    // Group data by date
    filteredData.forEach((item) => {
      const itemDate = new Date(item.date)
      let dateKey

      if (timeFrame === "day") {
        // Group by hour
        dateKey = `${itemDate.getHours()}:00`
      } else if (timeFrame === "week") {
        // Group by day of week
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        dateKey = days[itemDate.getDay()]
      } else if (timeFrame === "month") {
        // Group by day of month
        dateKey = itemDate.getDate().toString()
      } else {
        // Group by month for year view
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        dateKey = months[itemDate.getMonth()]
      }

      if (dateMap.has(dateKey)) {
        const existingValue = dateMap.get(dateKey)
        dateMap.set(dateKey, existingValue + (item[dataKey] || 0))
      } else {
        dateMap.set(dateKey, item[dataKey] || 0)
      }
    })

    // Convert map to array
    dateMap.forEach((value, date) => {
      result.push({
        date,
        [dataKey]: value,
      })
    })

    // Sort result by date
    if (timeFrame === "week") {
      const dayOrder = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
      result.sort((a, b) => dayOrder[a.date as keyof typeof dayOrder] - dayOrder[b.date as keyof typeof dayOrder])
    } else if (timeFrame === "year") {
      const monthOrder = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      }
      result.sort(
        (a, b) => monthOrder[a.date as keyof typeof monthOrder] - monthOrder[b.date as keyof typeof monthOrder],
      )
    } else if (timeFrame === "day") {
      result.sort((a, b) => {
        const hourA = Number.parseInt(a.date.split(":")[0])
        const hourB = Number.parseInt(b.date.split(":")[0])
        return hourA - hourB
      })
    } else {
      result.sort((a, b) => Number.parseInt(a.date) - Number.parseInt(b.date))
    }

    return result
  }

  // Calculate reasonable Y-axis domain based on data
  const calculateYAxisDomain = () => {
    if (chartData.length === 0) return [0, 100]

    // Find the maximum value in the data
    const maxValue = Math.max(...chartData.map((item) => item[dataKey] || 0))

    // Add 10% padding to the top
    const topPadding = maxValue * 0.1

    // Round to a nice number
    const roundedMax = Math.ceil((maxValue + topPadding) / 100) * 100

    return [0, roundedMax]
  }

  return (
    <Card className="w-full p-4">
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <Button
            variant={timeFrame === "day" ? "default" : "outline"}
            className="rounded-l-md rounded-r-none"
            onClick={() => setTimeFrame("day")}
          >
            Day
          </Button>
          <Button
            variant={timeFrame === "week" ? "default" : "outline"}
            className="rounded-none border-l-0 border-r-0"
            onClick={() => setTimeFrame("week")}
          >
            Week
          </Button>
          <Button
            variant={timeFrame === "month" ? "default" : "outline"}
            className="rounded-none border-l-0 border-r-0"
            onClick={() => setTimeFrame("month")}
          >
            Month
          </Button>
          <Button
            variant={timeFrame === "year" ? "default" : "outline"}
            className="rounded-r-md rounded-l-none"
            onClick={() => setTimeFrame("year")}
          >
            Year
          </Button>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={calculateYAxisDomain()} />
            <Tooltip
              formatter={(value) => [`${value} ${dataKey === "caloriesBurned" ? "kcal" : ""}`, label]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

