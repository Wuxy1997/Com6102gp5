"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Plus, Activity, Timer, Flame, BarChart } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"
import { Badge } from "@/components/ui/badge"
import { useInputHistory } from "@/hooks/useInputHistory"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function ExerciseTrackerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [exerciseData, setExerciseData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { addToHistory, findHistory } = useInputHistory()
  const [newExercise, setNewExercise] = useState({
    name: "",
    duration: "",
    calories: "",
    date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setIsLoading(true)
          // Fetch exercise data
          const exerciseRes = await fetch("/api/exercise-data")
          if (exerciseRes.ok) {
            const exerciseData = await exerciseRes.json()
            setExerciseData(exerciseData)
            console.log("Fetched exercise data:", exerciseData)
          } else {
            const errorData = await exerciseRes.json()
            setError(errorData.error || "Failed to fetch exercise data")
          }
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("An error occurred while fetching your exercise data")
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [user])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Prepare data for exercise duration chart
  const prepareDurationChartData = () => {
    if (exerciseData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "Duration (minutes)",
            data: [],
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
          },
        ],
      }
    }

    // Sort data by date
    const sortedData = [...exerciseData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      labels: sortedData.map((item) => formatDate(item.date)),
      datasets: [
        {
          label: "Duration (minutes)",
          data: sortedData.map((item) => item.duration),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
        },
      ],
    }
  }

  // Prepare data for exercise type distribution chart
  const prepareExerciseTypeChartData = () => {
    if (exerciseData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "Number of Sessions",
            data: [],
            backgroundColor: [
              "rgba(255, 99, 132, 0.5)",
              "rgba(54, 162, 235, 0.5)",
              "rgba(255, 206, 86, 0.5)",
              "rgba(75, 192, 192, 0.5)",
              "rgba(153, 102, 255, 0.5)",
              "rgba(255, 159, 64, 0.5)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      }
    }

    // Count exercise types
    const exerciseTypes: { [key: string]: number } = {}
    exerciseData.forEach((item) => {
      const type = item.type
      exerciseTypes[type] = (exerciseTypes[type] || 0) + 1
    })

    return {
      labels: Object.keys(exerciseTypes).map((type) => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [
        {
          label: "Number of Sessions",
          data: Object.values(exerciseTypes),
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 206, 86, 0.5)",
            "rgba(75, 192, 192, 0.5)",
            "rgba(153, 102, 255, 0.5)",
            "rgba(255, 159, 64, 0.5)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  // Calculate total exercise stats
  const calculateExerciseStats = () => {
    if (exerciseData.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        totalCalories: 0,
        averageDuration: 0,
      }
    }

    const totalSessions = exerciseData.length
    const totalDuration = exerciseData.reduce((sum, item) => sum + item.duration, 0)
    const totalCalories = exerciseData.reduce((sum, item) => sum + (item.caloriesBurned || 0), 0)
    const averageDuration = totalDuration / totalSessions

    return {
      totalSessions,
      totalDuration,
      totalCalories,
      averageDuration: Math.round(averageDuration),
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  }

  // Get intensity label and color
  const getIntensityInfo = (intensity: number) => {
    switch (intensity) {
      case 1:
        return { label: "Very Light", color: "bg-blue-100 text-blue-800" }
      case 2:
        return { label: "Light", color: "bg-green-100 text-green-800" }
      case 3:
        return { label: "Moderate", color: "bg-yellow-100 text-yellow-800" }
      case 4:
        return { label: "Hard", color: "bg-orange-100 text-orange-800" }
      case 5:
        return { label: "Very Hard", color: "bg-red-100 text-red-800" }
      default:
        return { label: "Unknown", color: "bg-gray-100 text-gray-800" }
    }
  }

  const stats = calculateExerciseStats()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewExercise(prev => {
      const updated = { ...prev, [name]: value }
      
      // 当名称改变时，检查历史记录
      if (name === "name" && value) {
        const history = findHistory(value, "workout")
        if (history) {
          if (history.duration) {
            updated.duration = history.duration.toString()
          }
          if (history.calories) {
            updated.calories = history.calories.toString()
          }
        }
      }
      
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const response = await fetch("/api/exercise-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newExercise,
          duration: parseInt(newExercise.duration),
          calories: parseInt(newExercise.calories),
        }),
      })

      if (response.ok) {
        // 添加到历史记录
        addToHistory({
          name: newExercise.name,
          duration: parseInt(newExercise.duration),
          calories: parseInt(newExercise.calories),
          type: "workout"
        })

        // 重置表单
        setNewExercise({
          name: "",
          duration: "",
          calories: "",
          date: new Date().toISOString().split("T")[0],
        })

        // 刷新数据
        const exerciseRes = await fetch("/api/exercise-data")
        if (exerciseRes.ok) {
          const exerciseData = await exerciseRes.json()
          setExerciseData(exerciseData)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to add exercise entry")
      }
    } catch (error) {
      console.error("Error adding exercise entry:", error)
      setError("An error occurred while adding your exercise entry")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Exercise Tracker</h1>
            <p className="text-muted-foreground">Track and analyze your exercise activities over time</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link href="/exercise-tracker/add">
                <Plus className="mr-2 h-4 w-4" />
                Record New Exercise
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : exerciseData.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Exercise Data Yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                You haven't recorded any exercise activities yet. Start tracking your workouts to see trends and
                insights.
              </p>
              <Button asChild>
                <Link href="/exercise-tracker/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Your First Exercise
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSessions}</div>
                  <p className="text-xs text-muted-foreground">Exercise sessions recorded</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDuration} min</div>
                  <p className="text-xs text-muted-foreground">Total exercise time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageDuration} min</div>
                  <p className="text-xs text-muted-foreground">Per exercise session</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calories</CardTitle>
                  <Flame className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCalories} kcal</div>
                  <p className="text-xs text-muted-foreground">Estimated calories burned</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="charts" className="mb-6">
              <TabsList>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="charts">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Exercise Duration Trend</CardTitle>
                      <CardDescription>Your exercise duration over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Line options={chartOptions} data={prepareDurationChartData()} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Exercise Type Distribution</CardTitle>
                      <CardDescription>Breakdown of your exercise activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Bar options={barChartOptions} data={prepareExerciseTypeChartData()} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Exercise History</CardTitle>
                    <CardDescription>All your recorded exercise activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Distance</TableHead>
                            <TableHead>Calories</TableHead>
                            <TableHead>Intensity</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {exerciseData
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{formatDate(item.date)}</TableCell>
                                <TableCell className="capitalize">{item.type}</TableCell>
                                <TableCell>{item.duration ? `${Math.round(item.duration)} min` : "-"}</TableCell>
                                <TableCell>{item.distance ? `${item.distance} km` : "-"}</TableCell>
                                <TableCell>{item.caloriesBurned ? `${item.caloriesBurned} kcal` : "-"}</TableCell>
                                <TableCell>
                                  {item.intensity ? (
                                    <Badge variant="outline" className={getIntensityInfo(item.intensity).color}>
                                      {getIntensityInfo(item.intensity).label}
                                    </Badge>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">{item.notes || "-"}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Exercise Entry</CardTitle>
            <CardDescription>Track your daily exercise</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Exercise Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newExercise.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={newExercise.duration}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="calories" className="block text-sm font-medium mb-1">
                    Calories Burned
                  </label>
                  <input
                    type="number"
                    id="calories"
                    name="calories"
                    value={newExercise.calories}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={newExercise.date}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Add Exercise Entry
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

