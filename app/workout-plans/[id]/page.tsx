"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AlertCircle, Calendar, ArrowLeft, Pencil, Trash2, Copy, CheckCircle, Timer, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function WorkoutPlanDetailPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [workoutPlan, setWorkoutPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeWeek, setActiveWeek] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([])
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false)
  const [selectedIntensity, setSelectedIntensity] = useState("moderate")
  const [caloriesBurned, setCaloriesBurned] = useState<string>("")
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<{ weekIndex: number; dayIndex: number } | null>(null)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      if (user) {
        try {
          setIsLoading(true)
          const response = await fetch(`/api/workout-plans/${params.id}`)

          if (response.ok) {
            const data = await response.json()
            setWorkoutPlan(data)
          } else {
            const errorData = await response.json()
            setError(errorData.error || "Failed to fetch workout plan")
          }
        } catch (error) {
          console.error("Error fetching workout plan:", error)
          setError("An error occurred while fetching the workout plan")
        } finally {
          setIsLoading(false)
        }
      }
    }

    const fetchCompletedWorkouts = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/workout-plans/completions?planId=${params.id}`)
          if (response.ok) {
            const data = await response.json()
            setCompletedWorkouts(data)

            // Calculate total time spent and calories burned
            let totalTime = 0
            let totalCalories = 0

            data.forEach((workout: any) => {
              totalTime += workout.duration || 0
              totalCalories += workout.caloriesBurned || 0
            })

            setTotalTimeSpent(totalTime)
            setTotalCaloriesBurned(totalCalories)
          }
        } catch (error) {
          console.error("Error fetching completed workouts:", error)
        }
      }
    }

    if (params.id) {
      fetchWorkoutPlan()
      fetchCompletedWorkouts()
    }
  }, [params.id, user])

  // Calculate exercise duration in minutes
  const calculateExerciseDuration = (exercise: any): number => {
    if (!exercise.startTime || !exercise.endTime) return 0

    const [startHour, startMinute] = exercise.startTime.split(":").map(Number)
    const [endHour, endMinute] = exercise.endTime.split(":").map(Number)

    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    // Handle cases where end time is on the next day
    return endTotalMinutes >= startTotalMinutes
      ? endTotalMinutes - startTotalMinutes
      : 24 * 60 - startTotalMinutes + endTotalMinutes
  }

  // Format duration as hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    }
    return `${mins}m`
  }

  // Format time from 24h to 12h format
  const formatTime = (time: string): string => {
    if (!time) return ""

    const [hourStr, minuteStr] = time.split(":")
    const hour = Number.parseInt(hourStr)
    const minute = minuteStr

    const period = hour >= 12 ? "PM" : "AM"
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

    return `${displayHour}:${minute} ${period}`
  }

  // Format time in minutes to hours and minutes
  const formatTimeOld = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/workout-plans/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Workout Plan Deleted",
          description: "Your workout plan has been successfully deleted",
        })
        router.push("/workout-plans")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete workout plan")
        setDeleteDialogOpen(false)
      }
    } catch (error) {
      console.error("Error deleting workout plan:", error)
      setError("An error occurred while deleting the workout plan")
      setDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const copyPlan = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/workout-plans/copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId: params.id }),
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
        setError(errorData.error || "Failed to copy workout plan")
      }
    } catch (error) {
      console.error("Error copying workout plan:", error)
      setError("An error occurred while copying the workout plan")
    } finally {
      setIsLoading(false)
    }
  }

  const openCompleteDialog = (weekIndex: number, dayIndex: number) => {
    setSelectedWorkout({ weekIndex, dayIndex })
    setCompleteDialogOpen(true)
  }

  const markWorkoutCompleted = async () => {
    if (!selectedWorkout) return

    const { weekIndex, dayIndex } = selectedWorkout

    try {
      console.log("Marking workout as completed:", { weekIndex, dayIndex, planId: params.id })
      setIsCompletingWorkout(true)
      const response = await fetch("/api/workout-plans/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: params.id,
          weekIndex: Number.parseInt(weekIndex.toString()),
          dayIndex: Number.parseInt(dayIndex.toString()),
          intensity: selectedIntensity,
          caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
        }),
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Completion successful:", data)
        toast({
          title: "Workout Completed",
          description: "Your workout has been marked as completed and added to your exercise records",
        })

        // Add to completed workouts
        const newCompletion = {
          weekIndex: Number.parseInt(weekIndex.toString()),
          dayIndex: Number.parseInt(dayIndex.toString()),
          completedAt: new Date(),
          workoutPlanId: params.id,
          dayName: workoutPlan.weeks[weekIndex].days[dayIndex].name,
          weekName: workoutPlan.weeks[weekIndex].name,
          caloriesBurned: caloriesBurned ? Number(caloriesBurned) : data.caloriesBurned,
          duration: data.duration || 30,
        }

        const updatedCompletions = [...completedWorkouts, newCompletion]
        setCompletedWorkouts(updatedCompletions)

        // Update totals
        setTotalTimeSpent(totalTimeSpent + (data.duration || 30))
        setTotalCaloriesBurned(totalCaloriesBurned + (caloriesBurned ? Number(caloriesBurned) : data.caloriesBurned))

        setCaloriesBurned("")
        setCompleteDialogOpen(false)
      } else {
        const errorData = await response.json()
        console.error("Completion failed:", errorData)
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

  // Check if a workout has been completed
  const isWorkoutCompleted = (weekIndex: number, dayIndex: number) => {
    return completedWorkouts.some((workout) => workout.weekIndex === weekIndex && workout.dayIndex === dayIndex)
  }

  // Get the completion date if workout is completed
  const getCompletionDate = (weekIndex: number, dayIndex: number) => {
    const workout = completedWorkouts.find((w) => w.weekIndex === weekIndex && w.dayIndex === dayIndex)
    return workout ? new Date(workout.completedAt).toLocaleDateString() : null
  }

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/workout-plans")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workout Plans
          </Button>
        </main>
      </div>
    )
  }

  if (!workoutPlan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Workout Plan Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The workout plan you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => router.push("/workout-plans")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workout Plans
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const isOwner = workoutPlan.userId === user?._id
  const completedWorkoutsCount = completedWorkouts.length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/workout-plans")}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Badge variant="outline" className={getDifficultyColor(workoutPlan.difficulty)}>
                {workoutPlan.difficulty}
              </Badge>
              {workoutPlan.isPublic && <Badge variant="outline">Public</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{workoutPlan.name}</h1>
            <p className="text-muted-foreground">{workoutPlan.description}</p>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <Clock className="mr-1 h-4 w-4" />
              <span>
                Total workout time:{" "}
                {formatDuration(
                  workoutPlan.weeks
                    .flatMap((week) =>
                      week.days.flatMap((day) =>
                        day.exercises.reduce((total, ex) => total + calculateExerciseDuration(ex), 0),
                      ),
                    )
                    .reduce((a, b) => a + b, 0),
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 md:mt-0 space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/workout-plans/${params.id}/calendar-view`}>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar View
              </Link>
            </Button>

            {isOwner ? (
              <>
                <Button variant="outline" onClick={() => router.push(`/workout-plans/${params.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Workout Plan</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this workout plan? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Button onClick={copyPlan} disabled={isLoading}>
                <Copy className="mr-2 h-4 w-4" />
                {isLoading ? "Copying..." : "Copy to My Plans"}
              </Button>
            )}
          </div>
        </div>

        {completedWorkoutsCount > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedWorkoutsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {completedWorkoutsCount === 1 ? "workout" : "workouts"} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Time Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTimeOld(totalTimeSpent)}</div>
                <p className="text-xs text-muted-foreground">across all completed workouts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Calories Burned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCaloriesBurned} kcal</div>
                <p className="text-xs text-muted-foreground">across all completed workouts</p>
              </CardContent>
            </Card>
          </div>
        )}

        {workoutPlan.tags && workoutPlan.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {workoutPlan.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Tabs defaultValue="0" onValueChange={(value) => setActiveWeek(Number.parseInt(value))}>
          <TabsList className="mb-4">
            {workoutPlan.weeks.map((week: any, index: number) => (
              <TabsTrigger key={index} value={index.toString()}>
                {week.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {workoutPlan.weeks.map((week: any, weekIndex: number) => (
            <TabsContent key={weekIndex} value={weekIndex.toString()}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {week.days.map((day: any, dayIndex: number) => (
                  <Card key={dayIndex} className={isWorkoutCompleted(weekIndex, dayIndex) ? "border-green-500" : ""}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-5 w-5" />
                          {day.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Clock className="inline mr-1 h-3 w-3" />
                          Total:{" "}
                          {formatDuration(
                            day.exercises.reduce((total, ex) => total + calculateExerciseDuration(ex), 0),
                          )}
                        </div>
                        {isWorkoutCompleted(weekIndex, dayIndex) && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </CardTitle>
                      {isWorkoutCompleted(weekIndex, dayIndex) && (
                        <p className="text-xs text-muted-foreground">
                          Completed on {getCompletionDate(weekIndex, dayIndex)}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {day.exercises.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No exercises for this day</p>
                      ) : (
                        <div className="space-y-4">
                          {day.exercises.map((exercise: any, exerciseIndex: number) => (
                            <div key={exerciseIndex} className="border-b pb-2 last:border-0">
                              <div className="font-medium">{exercise.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {exercise.sets} sets × {exercise.reps} reps
                                {exercise.weight && ` @ ${exercise.weight}`}
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {exercise.startTime && exercise.endTime && (
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-3 w-3" />
                                    <span>
                                      {formatTime(exercise.startTime)} - {formatTime(exercise.endTime)}(
                                      {formatDuration(calculateExerciseDuration(exercise))})
                                    </span>
                                  </div>
                                )}
                              </div>
                              {exercise.notes && <div className="text-xs mt-1">{exercise.notes}</div>}
                            </div>
                          ))}

                          <div className="flex items-center text-sm text-muted-foreground mt-2">
                            <Timer className="mr-2 h-4 w-4" />
                            <span>
                              Estimated time:{" "}
                              {formatDuration(
                                day.exercises.reduce((total, ex) => total + calculateExerciseDuration(ex), 0),
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      {!isWorkoutCompleted(weekIndex, dayIndex) && day.exercises.length > 0 && (
                        <Button className="w-full" onClick={() => openCompleteDialog(weekIndex, dayIndex)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Complete Workout Dialog */}
        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Workout</DialogTitle>
              <DialogDescription>Record your workout completion details</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="intensity" className="text-sm font-medium">
                  Workout Intensity
                </label>
                <Select value={selectedIntensity} onValueChange={setSelectedIntensity}>
                  <SelectTrigger id="intensity">
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="intense">Intense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="calories" className="text-sm font-medium">
                  Calories Burned (optional)
                </label>
                <div className="flex items-center">
                  <input
                    id="calories"
                    type="number"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    placeholder="Enter calories"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">kcal</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={markWorkoutCompleted} disabled={isCompletingWorkout}>
                {isCompletingWorkout ? "Completing..." : "Complete Workout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

