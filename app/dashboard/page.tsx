"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Activity, Heart, Calendar, Brain, TrendingUp } from "lucide-react"
import { PageLayout } from "@/components/page-layout"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [healthData, setHealthData] = useState<any[]>([])
  const [exerciseData, setExerciseData] = useState<any[]>([])
  const [foodData, setFoodData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [goals, setGoals] = useState<any[]>([])

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
          // Fetch health data
          const healthRes = await fetch("/api/health-data")
          if (healthRes.ok) {
            const healthData = await healthRes.json()
            setHealthData(healthData)
          } else {
            const errorData = await healthRes.json()
            setError(errorData.error || "Failed to fetch health data")
          }

          // Fetch exercise data
          const exerciseRes = await fetch("/api/exercise-data")
          if (exerciseRes.ok) {
            const exerciseData = await exerciseRes.json()
            setExerciseData(exerciseData)
          } else {
            const errorData = await exerciseRes.json()
            setError(errorData.error || "Failed to fetch exercise data")
          }

          // Fetch food data
          const foodRes = await fetch("/api/food-data")
          if (foodRes.ok) {
            const foodData = await foodRes.json()
            setFoodData(foodData)
          } else {
            const errorData = await foodRes.json()
            setError(errorData.error || "Failed to fetch food data")
          }

          // Fetch goals
          const goalsRes = await fetch("/api/goals")
          if (goalsRes.ok) {
            const goalsData = await goalsRes.json()
            setGoals(goalsData)
          }
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("An error occurred while fetching your health data")
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

  // Calculate calories remaining
  const calculateCaloriesRemaining = () => {
    const currentHealthData = healthData[0] || null
    if (!currentHealthData) return { consumed: 0, burned: 0, remaining: 0, goal: 2000 }

    const calorieGoal = currentHealthData.calorieGoal || 2000
    const caloriesConsumed = foodData
      .filter((item) => {
        const itemDate = new Date(item.date)
        const today = new Date()
        return (
          itemDate.getDate() === today.getDate() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear()
        )
      })
      .reduce((sum, item) => sum + item.calories, 0)

    const caloriesBurned = exerciseData
      .filter((item) => {
        const itemDate = new Date(item.date)
        const today = new Date()
        return (
          itemDate.getDate() === today.getDate() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear()
        )
      })
      .reduce((sum, item) => sum + (item.caloriesBurned || 0), 0)

    const remaining = calorieGoal - caloriesConsumed + caloriesBurned

    return {
      consumed: caloriesConsumed,
      burned: caloriesBurned,
      remaining: remaining,
      goal: calorieGoal,
    }
  }

  // Get goal progress
  const getGoalProgress = (goal: any) => {
    if (!goal) return 0
    const currentHealthData = healthData[0] || null

    if (goal.type === "weight") {
      if (!currentHealthData) return 0
      const startValue = goal.startValue
      const targetValue = goal.targetValue
      const currentValue = currentHealthData.weight

      // If target is to lose weight
      if (startValue > targetValue) {
        if (currentValue >= startValue) return 0
        if (currentValue <= targetValue) return 100
        return Math.round(((startValue - currentValue) / (startValue - targetValue)) * 100)
      }
      // If target is to gain weight
      else {
        if (currentValue <= startValue) return 0
        if (currentValue >= targetValue) return 100
        return Math.round(((currentValue - startValue) / (targetValue - startValue)) * 100)
      }
    } else if (goal.type === "exercise") {
      const targetMinutes = goal.targetValue
      const currentMinutes = exerciseData.reduce((sum, item) => sum + item.duration, 0)
      return Math.min(Math.round((currentMinutes / targetMinutes) * 100), 100)
    } else if (goal.type === "calories") {
      const targetCalories = goal.targetValue
      const currentCalories = exerciseData.reduce((sum, item) => sum + (item.caloriesBurned || 0), 0)
      return Math.min(Math.round((currentCalories / targetCalories) * 100), 100)
    }
    return 0
  }

  const calorieInfo = calculateCaloriesRemaining()
  const currentHealthData = healthData[0] || null

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        <p className="text-xl text-gray-400">Welcome back! Here's an overview of your health data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weight Tracking</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75.5 kg</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>2% improvement</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exercise Minutes</CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">320 min</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>15% above target</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85/100</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>5 points improvement</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  <div>
                    <p className="font-medium">HIIT Workout</p>
                    <p className="text-sm text-gray-400">30 minutes</p>
                  </div>
                </div>
                <Button size="sm" className="green-button">
                  Start
                </Button>
              </div>

              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  <div>
                    <p className="font-medium">Strength Training</p>
                    <p className="text-sm text-gray-400">45 minutes</p>
                  </div>
                </div>
                <Button size="sm" className="green-button">
                  Start
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  <div>
                    <p className="font-medium">Yoga Session</p>
                    <p className="text-sm text-gray-400">20 minutes</p>
                  </div>
                </div>
                <Button size="sm" className="green-button">
                  Start
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-black rounded-lg border border-green-500">
                <h3 className="font-bold text-green-500 mb-2">Sleep Quality Improving</h3>
                <p className="text-sm text-gray-400">
                  Your average sleep duration has increased by 45 minutes. Keep up the good work!
                </p>
              </div>

              <div className="p-4 bg-black rounded-lg border border-yellow-500">
                <h3 className="font-bold text-yellow-500 mb-2">Hydration Alert</h3>
                <p className="text-sm text-gray-400">
                  You're consistently below your daily water intake goal. Try to increase your water consumption.
                </p>
              </div>

              <div className="p-4 bg-black rounded-lg border border-green-500">
                <h3 className="font-bold text-green-500 mb-2">Workout Consistency</h3>
                <p className="text-sm text-gray-400">
                  You've maintained your workout schedule for 2 weeks straight. Great discipline!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

