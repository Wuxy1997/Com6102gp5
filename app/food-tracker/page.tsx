"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Plus, Utensils, Apple, Coffee, Pizza } from "lucide-react"
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
import { useInputHistory } from "@/hooks/useInputHistory"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function FoodTrackerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [foodData, setFoodData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { addToHistory, findHistory } = useInputHistory()
  const [newFood, setNewFood] = useState({
    name: "",
    calories: "",
    mealType: "breakfast",
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
          const foodRes = await fetch("/api/food-data")
          if (foodRes.ok) {
            const foodData = await foodRes.json()
            setFoodData(foodData)
            console.log("Fetched food data:", foodData)
          } else {
            const errorData = await foodRes.json()
            setError(errorData.error || "Failed to fetch food data")
          }
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("An error occurred while fetching your food data")
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

  // Calculate daily calorie totals
  const calculateDailyCalories = () => {
    const dailyTotals: { [key: string]: number } = {}
    foodData.forEach((item) => {
      const date = new Date(item.date).toDateString()
      dailyTotals[date] = (dailyTotals[date] || 0) + item.calories
    })
    return dailyTotals
  }

  // Prepare data for calorie chart
  const prepareCalorieChartData = () => {
    const dailyTotals = calculateDailyCalories()
    const sortedDates = Object.keys(dailyTotals).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    return {
      labels: sortedDates.map((date) => formatDate(date)),
      datasets: [
        {
          label: "Daily Calories",
          data: sortedDates.map((date) => dailyTotals[date]),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
        },
      ],
    }
  }

  // Prepare data for meal type distribution
  const prepareMealTypeChartData = () => {
    const mealTypes: { [key: string]: number } = {}
    foodData.forEach((item) => {
      mealTypes[item.mealType] = (mealTypes[item.mealType] || 0) + 1
    })

    return {
      labels: Object.keys(mealTypes).map((type) => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [
        {
          label: "Meal Distribution",
          data: Object.values(mealTypes),
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 206, 86, 0.5)",
            "rgba(75, 192, 192, 0.5)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
          ],
          borderWidth: 1,
        },
      ],
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

  // Calculate nutrition stats
  const calculateNutritionStats = () => {
    if (foodData.length === 0) {
      return {
        todayCalories: 0,
        averageCalories: 0,
        totalMeals: 0,
        commonMealType: "N/A",
      }
    }

    const today = new Date().toDateString()
    const dailyTotals = calculateDailyCalories()
    const todayCalories = dailyTotals[today] || 0

    const totalCalories = Object.values(dailyTotals).reduce((sum, cal) => sum + cal, 0)
    const averageCalories = Math.round(totalCalories / Object.keys(dailyTotals).length)

    const mealTypes: { [key: string]: number } = {}
    foodData.forEach((item) => {
      mealTypes[item.mealType] = (mealTypes[item.mealType] || 0) + 1
    })
    const commonMealType = Object.entries(mealTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"

    return {
      todayCalories,
      averageCalories,
      totalMeals: foodData.length,
      commonMealType: commonMealType.charAt(0).toUpperCase() + commonMealType.slice(1),
    }
  }

  const stats = calculateNutritionStats()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewFood(prev => {
      const updated = { ...prev, [name]: value }
      
      // 当名称改变时，检查历史记录
      if (name === "name" && value) {
        const history = findHistory(value, "nutrition")
        if (history && history.calories) {
          updated.calories = history.calories.toString()
        }
      }
      
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const response = await fetch("/api/food-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newFood,
          calories: parseInt(newFood.calories),
        }),
      })

      if (response.ok) {
        // 添加到历史记录
        addToHistory({
          name: newFood.name,
          calories: parseInt(newFood.calories),
          type: "nutrition"
        })

        // 重置表单
        setNewFood({
          name: "",
          calories: "",
          mealType: "breakfast",
          date: new Date().toISOString().split("T")[0],
        })

        // 刷新数据
        const foodRes = await fetch("/api/food-data")
        if (foodRes.ok) {
          const foodData = await foodRes.json()
          setFoodData(foodData)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to add food entry")
      }
    } catch (error) {
      console.error("Error adding food entry:", error)
      setError("An error occurred while adding your food entry")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Food Tracker</h1>
            <p className="text-muted-foreground">Track your daily food intake and nutrition</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link href="/food-tracker/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Food Entry
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Calories</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCalories}</div>
              <p className="text-xs text-muted-foreground">kcal consumed today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Daily Calories</CardTitle>
              <Pizza className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageCalories}</div>
              <p className="text-xs text-muted-foreground">kcal per day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMeals}</div>
              <p className="text-xs text-muted-foreground">meals recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Common Meal</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.commonMealType}</div>
              <p className="text-xs text-muted-foreground">most frequent meal type</p>
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
                  <CardTitle>Daily Calorie Intake</CardTitle>
                  <CardDescription>Your calorie consumption over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Line options={chartOptions} data={prepareCalorieChartData()} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Meal Type Distribution</CardTitle>
                  <CardDescription>Breakdown of your meal types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Bar options={chartOptions} data={prepareMealTypeChartData()} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Food History</CardTitle>
                <CardDescription>Your recorded meals and snacks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Food</TableHead>
                        <TableHead>Meal Type</TableHead>
                        <TableHead>Calories</TableHead>
                        <TableHead>Serving Size</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {foodData
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell className="font-medium">{item.foodName}</TableCell>
                            <TableCell className="capitalize">{item.mealType}</TableCell>
                            <TableCell>{item.calories} kcal</TableCell>
                            <TableCell>{item.servingSize}</TableCell>
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

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Food Entry</CardTitle>
            <CardDescription>Track your daily food intake</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Food Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newFood.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="calories" className="block text-sm font-medium mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    id="calories"
                    name="calories"
                    value={newFood.calories}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="mealType" className="block text-sm font-medium mb-1">
                    Meal Type
                  </label>
                  <select
                    id="mealType"
                    name="mealType"
                    value={newFood.mealType}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={newFood.date}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Add Food Entry
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

