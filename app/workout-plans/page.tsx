"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Plus, Dumbbell, Calendar, Clock, Tag, Copy, CheckCircle, Timer, Activity } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function WorkoutPlansPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([])
  const [publicPlans, setPublicPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [selectedIntensity, setSelectedIntensity] = useState("moderate")
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [caloriesBurned, setCaloriesBurned] = useState<string>("")

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
          // Fetch user's workout plans
          const plansRes = await fetch("/api/workout-plans")
          if (plansRes.ok) {
            const plansData = await plansRes.json()
            setWorkoutPlans(plansData)
          } else {
            const errorData = await plansRes.json()
            setError(errorData.error || "Failed to fetch workout plans")
          }

          // Fetch public workout plans
          const publicPlansRes = await fetch("/api/workout-plans/public")
          if (publicPlansRes.ok) {
            const publicPlansData = await publicPlansRes.json()
            setPublicPlans(publicPlansData)
          }

          // Fetch all completed workouts
          const completionsRes = await fetch("/api/workout-plans/all-completions")
          if (completionsRes.ok) {
            const completionsData = await completionsRes.json()
            setCompletedWorkouts(completionsData)
          }
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("An error occurred while fetching workout plans")
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

  // Format time in minutes to hours and minutes
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
  }

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-blue-100 text-blue-800"
      case "advanced":
        return "bg-orange-100 text-orange-800"
      case "expert":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const copyPlan = async (planId: string) => {
    try {
      const response = await fetch("/api/workout-plans/copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Plan Copied",
          description: "The workout plan has been copied to your collection",
        })
        router.push(`/workout-plans/${data._id}`)
      } else {
        const errorData = await response.json()
        toast({
          title: "Copy Failed",
          description: errorData.error || "Failed to copy workout plan",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error copying workout plan:", error)
      toast({
        title: "Copy Failed",
        description: "An error occurred while copying the workout plan",
        variant: "destructive",
      })
    }
  }

  // Check if a workout has been completed
  const getPlanCompletionStatus = (planId: string) => {
    const planCompletions = completedWorkouts.filter((workout) => workout.workoutPlanId === planId)
    if (planCompletions.length === 0) return { completed: false, count: 0 }

    // Calculate total time spent on this plan
    const totalTimeMinutes = planCompletions.reduce((total, workout) => {
      return total + (workout.duration || 0)
    }, 0)

    // Calculate total calories burned
    const totalCaloriesBurned = planCompletions.reduce((total, workout) => {
      return total + (workout.caloriesBurned || 0)
    }, 0)

    return {
      completed: true,
      count: planCompletions.length,
      lastCompleted: new Date(Math.max(...planCompletions.map((w) => new Date(w.completedAt).getTime()))),
      totalTimeMinutes,
      totalCaloriesBurned,
    }
  }

  const openCompleteDialog = (plan: any) => {
    setSelectedPlan(plan)
    setSelectedWeekIndex(0)
    setSelectedDayIndex(0)
    setCompleteDialogOpen(true)
  }

  const markWorkoutCompleted = async () => {
    if (!selectedPlan) return

    try {
      setIsCompletingWorkout(true)
      const response = await fetch("/api/workout-plans/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan._id,
          weekIndex: selectedWeekIndex,
          dayIndex: selectedDayIndex,
          intensity: selectedIntensity,
          caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Workout Completed",
          description: "Your workout has been marked as completed and added to your exercise records",
        })

        // Add to completed workouts
        const newCompletion = {
          weekIndex: selectedWeekIndex,
          dayIndex: selectedDayIndex,
          completedAt: new Date(),
          workoutPlanId: selectedPlan._id,
          dayName: selectedPlan.weeks[selectedWeekIndex].days[selectedDayIndex].name,
          weekName: selectedPlan.weeks[selectedWeekIndex].name,
          caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
          duration: data.duration || 30, // Default to 30 minutes if no duration provided
        }

        setCompletedWorkouts([...completedWorkouts, newCompletion])
        setCompleteDialogOpen(false)
        setCaloriesBurned("")
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to mark workout as completed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error marking workout as completed:", error)
      toast({
        title: "Error",
        description: "An error occurred while marking the workout as completed",
        variant: "destructive",
      })
    } finally {
      setIsCompletingWorkout(false)
    }
  }

  // Calculate total time for a workout plan
  const calculateTotalTime = (plan: any): string => {
    let totalMinutes = 0

    if (plan.weeks) {
      plan.weeks.forEach((week: any) => {
        if (week.days) {
          week.days.forEach((day: any) => {
            if (day.exercises) {
              day.exercises.forEach((exercise: any) => {
                if (exercise.startTime && exercise.endTime) {
                  const [startHour, startMinute] = exercise.startTime.split(":").map(Number)
                  const [endHour, endMinute] = exercise.endTime.split(":").map(Number)

                  const startTotalMinutes = startHour * 60 + startMinute
                  const endTotalMinutes = endHour * 60 + endMinute

                  // Handle cases where end time is on the next day
                  const duration =
                    endTotalMinutes >= startTotalMinutes
                      ? endTotalMinutes - startTotalMinutes
                      : 24 * 60 - startTotalMinutes + endTotalMinutes

                  totalMinutes += duration
                }
              })
            }
          })
        }
      })
    }

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`
    }
    return `${minutes}m`
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
            <h1 className="text-3xl font-bold">Workout Plans</h1>
            <p className="text-muted-foreground">Create and follow structured workout programs</p>
          </div>
          <div className="mt-4 md:mt-0 space-x-2">
            <Button asChild variant="outline">
              <Link href="/workout-plans/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Create Calendar Plan
              </Link>
            </Button>
            <Button asChild>
              <Link href="/workout-plans/create">
                <Plus className="mr-2 h-4 w-4" />
                Create New Plan
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

        <Tabs defaultValue="my-plans" className="mb-6">
          <TabsList>
            <TabsTrigger value="my-plans">My Plans</TabsTrigger>
            <TabsTrigger value="public-plans">Public Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="my-plans">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : workoutPlans.length === 0 ? (
              <Card className="mb-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Dumbbell className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Workout Plans Yet</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    You haven't created any workout plans yet. Create your first plan to start organizing your fitness
                    journey.
                  </p>
                  <Button asChild>
                    <Link href="/workout-plans/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Plan
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workoutPlans.map((plan) => {
                  const completionStatus = getPlanCompletionStatus(plan._id)
                  return (
                    <Card key={plan._id} className={completionStatus.completed ? "border-green-500" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <Badge variant="outline" className={getDifficultyColor(plan.difficulty)}>
                            {plan.difficulty}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>{plan.weeks.length} weeks</span>
                        </div>
                        {plan.weeks && (
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Clock className="mr-1 h-4 w-4" />
                            <span>Total time: {calculateTotalTime(plan)}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Clock className="mr-2 h-4 w-4" />
                          <span>Created on {formatDate(plan.createdAt)}</span>
                        </div>
                        {completionStatus.completed && (
                          <>
                            <div className="flex items-center text-sm text-green-600 mb-2">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              <span>
                                {completionStatus.count} {completionStatus.count === 1 ? "workout" : "workouts"}{" "}
                                completed
                                {completionStatus.lastCompleted &&
                                  ` (Last: ${formatDate(completionStatus.lastCompleted.toString())})`}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-blue-600 mb-2">
                              <Timer className="mr-2 h-4 w-4" />
                              <span>Total time: {formatTime(completionStatus.totalTimeMinutes)}</span>
                            </div>
                            <div className="flex items-center text-sm text-orange-600 mb-2">
                              <Activity className="mr-2 h-4 w-4" />
                              <span>Total calories: {completionStatus.totalCaloriesBurned} kcal</span>
                            </div>
                          </>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {plan.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/workout-plans/${plan._id}/edit`}>Edit</Link>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openCompleteDialog(plan)}>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Complete
                          </Button>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/workout-plans/${plan._id}`}>View Plan</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="public-plans">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : publicPlans.length === 0 ? (
              <Card className="mb-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Dumbbell className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Public Plans Available</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    There are no public workout plans available at the moment. Create your own plan and share it with
                    the community!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicPlans.map((plan) => (
                  <Card key={plan._id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <Badge variant="outline" className={getDifficultyColor(plan.difficulty)}>
                          {plan.difficulty}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>{plan.weeks.length} weeks</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Tag className="mr-2 h-4 w-4" />
                        <span>By {plan.creatorName}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {plan.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => copyPlan(plan._id)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/workout-plans/${plan._id}`}>View Plan</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog for marking workout as completed */}
        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Mark Workout as Completed</DialogTitle>
              <DialogDescription>Select which workout day you've completed from {selectedPlan?.name}</DialogDescription>
            </DialogHeader>

            {selectedPlan && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Week</label>
                  <Select
                    value={selectedWeekIndex.toString()}
                    onValueChange={(value) => setSelectedWeekIndex(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPlan.weeks.map((week: any, index: number) => (
                        <SelectItem key={index} value={index.toString()}>
                          {week.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Day</label>
                  <Select
                    value={selectedDayIndex.toString()}
                    onValueChange={(value) => setSelectedDayIndex(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPlan.weeks[selectedWeekIndex]?.days.map((day: any, index: number) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Intensity</label>
                  <Select value={selectedIntensity} onValueChange={setSelectedIntensity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="intense">Intense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Calories Burned</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={caloriesBurned}
                      onChange={(e) => setCaloriesBurned(e.target.value)}
                      placeholder="Enter calories burned"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="ml-2 text-sm text-muted-foreground">kcal</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Leave empty to use automatic calculation</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCompleteDialogOpen(false)
                  setCaloriesBurned("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={markWorkoutCompleted} disabled={isCompletingWorkout}>
                {isCompletingWorkout ? "Marking as Completed..." : "Mark as Completed"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

