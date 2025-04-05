"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AlertCircle, Calendar, ArrowLeft, Clock, Edit, Info, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Days of the week
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

// Time slots for all 24 hours
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i
  const amPm = hour < 12 ? "am" : "pm"
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return {
    id: `${hour.toString().padStart(2, "0")}:00`,
    label: `${hour12}:00 ${amPm}`,
    hour,
  }
})

// Exercise type for the calendar
type CalendarExercise = {
  name: string
  sets?: string
  reps?: string
  weight?: string
  notes?: string
  startTime?: string
  endTime?: string
}

export default function WeeklyScheduleView({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [workoutPlan, setWorkoutPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [calendarData, setCalendarData] = useState<Record<string, Record<string, CalendarExercise[]>>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState<CalendarExercise[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null)
  const [upcomingExercise, setUpcomingExercise] = useState<any>(null)
  const [showNotification, setShowNotification] = useState(true)

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
          const response = await fetch(`/api/weekly-schedule/${params.id}`)

          if (response.ok) {
            const data = await response.json()
            setWorkoutPlan(data)

            // Process the workout plan data into a calendar format
            processWorkoutPlanToCalendar(data)
          } else {
            const errorData = await response.json()
            setError(errorData.error || "Failed to fetch weekly schedule")
          }
        } catch (error) {
          console.error("Error fetching weekly schedule:", error)
          setError("An error occurred while fetching the weekly schedule")
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (params.id) {
      fetchWorkoutPlan()
    }
  }, [params.id, user])

  // Find upcoming exercise within the next hour
  useEffect(() => {
    if (!workoutPlan) return

    const now = new Date()

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const currentDayIndex = now.getDay()
    // Convert to our format (0 = Monday, 6 = Sunday)
    const adjustedDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1
    const currentDay = DAYS_OF_WEEK[adjustedDayIndex]

    // Current hour in 24-hour format
    const currentHour = now.getHours()

    let foundExercise = null

    // Check all exercises for the current day
    if (workoutPlan.weeks && workoutPlan.weeks.length > 0) {
      const currentDayData = workoutPlan.weeks[0].days.find((day: any) => day.name === currentDay)

      if (currentDayData) {
        currentDayData.exercises.forEach((exercise: any) => {
          if (exercise.startTime && exercise.endTime) {
            const [startHour] = exercise.startTime.split(":").map(Number)

            // Check if exercise starts within the next hour
            if (startHour > currentHour && startHour <= currentHour + 1) {
              foundExercise = {
                ...exercise,
                day: currentDay,
                timeUntilStart: startHour - currentHour,
              }
            }
          }
        })
      }
    }

    setUpcomingExercise(foundExercise)
  }, [workoutPlan])

  // Process workout plan data into calendar format
  const processWorkoutPlanToCalendar = (plan: any) => {
    const calendar: Record<string, Record<string, CalendarExercise[]>> = {}

    // Initialize empty calendar
    DAYS_OF_WEEK.forEach((day) => {
      calendar[day] = {}
      TIME_SLOTS.forEach((slot) => {
        calendar[day][slot.id] = []
      })
    })

    // Process each day in the workout plan
    if (plan.weeks && plan.weeks.length > 0) {
      plan.weeks[0].days.forEach((day: any) => {
        // Map day name to calendar day
        const dayName = day.name

        if (DAYS_OF_WEEK.includes(dayName)) {
          // Process exercises for this day
          day.exercises.forEach((exercise: any) => {
            // Extract time from exercise name if it exists
            // Format: "Exercise Name (10:00 am-11:00 am)" or similar
            let startTime = "08:00"
            let endTime = "09:00"
            let exerciseName = exercise.name

            // Check if exercise has explicit start and end times
            if (exercise.startTime && exercise.endTime) {
              startTime = exercise.startTime
              endTime = exercise.endTime
            } else {
              // Try to extract from name
              const timeMatch = exercise.name.match(/$$(.*?)-(.*?)$$$/i)
              if (timeMatch) {
                exerciseName = exercise.name.replace(/\s*$$.*?-.*?$$$/i, "").trim()

                // Parse the time strings
                const startTimeStr = timeMatch[1].trim().toLowerCase()
                const endTimeStr = timeMatch[2].trim().toLowerCase()

                // Convert to 24-hour format
                startTime = convertTimeStringTo24Hour(startTimeStr)
                endTime = convertTimeStringTo24Hour(endTimeStr)
              }
            }

            // Add exercise to all relevant time slots
            const calendarExercise = {
              name: exerciseName,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              notes: exercise.notes,
              startTime: startTime,
              endTime: endTime,
            }

            // Add to the starting time slot
            const startHour = startTime.split(":")[0]
            const startSlot = `${startHour}:00`

            if (calendar[dayName][startSlot]) {
              calendar[dayName][startSlot].push(calendarExercise)
            }
          })
        }
      })
    }

    setCalendarData(calendar)
  }

  // Helper function to convert time string to 24-hour format
  const convertTimeStringTo24Hour = (timeStr: string): string => {
    let hour = 0
    let minute = 0

    // Extract hour and minute
    const timeParts = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i)
    if (timeParts) {
      hour = Number.parseInt(timeParts[1])
      minute = timeParts[2] ? Number.parseInt(timeParts[2]) : 0
      const period = timeParts[3]?.toLowerCase()

      // Adjust for AM/PM
      if (period === "pm" && hour < 12) hour += 12
      if (period === "am" && hour === 12) hour = 0
    }

    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }

  // Format time for display
  const formatTimeDisplay = (time: string): string => {
    if (!time) return ""
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "pm" : "am"
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "intermediate":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "advanced":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
      case "expert":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  // Get all exercises for a specific day
  const getDayExercises = (day: string): CalendarExercise[] => {
    const allExercises: CalendarExercise[] = []
    Object.values(calendarData[day] || {}).forEach((exercises) => {
      allExercises.push(...exercises)
    })
    return allExercises
  }

  // Check if a time slot has an exercise that starts at exactly this time
  const getExercisesStartingAt = (day: string, timeSlot: string): CalendarExercise[] => {
    const dayExercises = getDayExercises(day)
    return dayExercises.filter((ex) => {
      const startHour = ex.startTime?.split(":")[0]
      return `${startHour}:00` === timeSlot
    })
  }

  // Check if a time slot is in the middle of an exercise
  const getExercisesCoveringTimeSlot = (day: string, timeSlot: string): CalendarExercise[] => {
    const dayExercises = getDayExercises(day)
    const [slotHour] = timeSlot.split(":").map(Number)
    const slotStartMinutes = slotHour * 60
    const slotEndMinutes = (slotHour + 1) * 60

    return dayExercises.filter((ex) => {
      if (!ex.startTime || !ex.endTime) return false

      const [startHour, startMinute] = ex.startTime.split(":").map(Number)
      const [endHour, endMinute] = ex.endTime.split(":").map(Number)

      const exerciseStartMinutes = startHour * 60 + (startMinute || 0)
      const exerciseEndMinutes = endHour * 60 + (endMinute || 0)

      // Check if this slot is within the exercise time range (but not the start)
      return slotStartMinutes > exerciseStartMinutes && slotStartMinutes < exerciseEndMinutes
    })
  }

  // Calculate the height of an exercise block based on its duration
  const calculateExerciseHeight = (startTime?: string, endTime?: string): number => {
    if (!startTime || !endTime) return 1

    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startMinutes = startHour * 60 + (startMinute || 0)
    const endMinutes = endHour * 60 + (endMinute || 0)

    // Calculate duration in hours (each row is 1 hour)
    return (endMinutes - startMinutes) / 60
  }

  // Open dialog to show exercises for a specific time slot
  const openExercisesDialog = (day: string, time: string) => {
    // Get exercises that start at this time slot
    const startingExercises = getExercisesStartingAt(day, time)

    // Get exercises that cover this time slot
    const coveringExercises = getExercisesCoveringTimeSlot(day, time)

    // Combine both sets of exercises without duplicates
    const allExercises = [...startingExercises]
    coveringExercises.forEach((ex) => {
      if (!allExercises.some((e) => e.name === ex.name && e.startTime === ex.startTime)) {
        allExercises.push(ex)
      }
    })

    setSelectedExercises(allExercises)
    setSelectedSlot({ day, time })
    setDialogOpen(true)
  }

  const handleEditSchedule = () => {
    router.push(`/weekly-schedule/${params.id}/edit`)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
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
      <div className="min-h-screen bg-gray-950 text-white">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/weekly-schedule")} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Weekly Schedule
          </Button>
        </main>
      </div>
    )
  }

  if (!workoutPlan) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Weekly Schedule Not Found</h2>
            <p className="text-gray-400 mb-6">
              The weekly schedule you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => router.push("/weekly-schedule")} className="bg-primary hover:bg-primary/90">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Weekly Schedule
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={getDifficultyColor(workoutPlan.difficulty)}>
                {workoutPlan.difficulty}
              </Badge>
              {workoutPlan.isPublic && <Badge variant="outline">Public</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{workoutPlan.name}</h1>
            <p className="text-gray-400">{workoutPlan.description}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={handleEditSchedule} className="bg-primary hover:bg-primary/90">
              <Edit className="mr-2 h-4 w-4" />
              Edit Schedule
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-0 bg-gray-900 text-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-800 p-2 bg-gray-800 sticky left-0 z-10">Time</th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day} className="border border-gray-800 p-2 bg-gray-800">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((timeSlot) => (
                    <tr key={timeSlot.id}>
                      <td className="border border-gray-800 p-2 bg-gray-800 font-medium text-sm sticky left-0 z-10">
                        {timeSlot.label}
                      </td>
                      {DAYS_OF_WEEK.map((day) => {
                        const exercisesStartingHere = getExercisesStartingAt(day, timeSlot.id)
                        const exercisesCoveringHere = getExercisesCoveringTimeSlot(day, timeSlot.id)

                        // If there are exercises starting at this time slot, render them
                        if (exercisesStartingHere.length > 0) {
                          return (
                            <td
                              key={`${day}-${timeSlot.id}`}
                              className="border border-gray-800 p-0 relative"
                              onClick={() => openExercisesDialog(day, timeSlot.id)}
                            >
                              {exercisesStartingHere.map((exercise, index) => {
                                const height = calculateExerciseHeight(exercise.startTime, exercise.endTime)
                                return (
                                  <div
                                    key={index}
                                    className="absolute inset-x-0 bg-blue-900/50 hover:bg-blue-800/60 transition-colors p-1 overflow-hidden text-xs"
                                    style={{
                                      top: 0,
                                      height: `${height * 100}%`,
                                      zIndex: 1,
                                    }}
                                  >
                                    <div className="font-medium truncate">{exercise.name}</div>
                                    <div className="text-gray-300 truncate">
                                      {formatTimeDisplay(exercise.startTime || "")} -{" "}
                                      {formatTimeDisplay(exercise.endTime || "")}
                                    </div>
                                  </div>
                                )
                              })}
                            </td>
                          )
                        }
                        // If this slot is covered by an exercise but not the start, render empty
                        else if (exercisesCoveringHere.length > 0) {
                          return (
                            <td
                              key={`${day}-${timeSlot.id}`}
                              className="border border-gray-800 p-0 bg-blue-900/30"
                              onClick={() => openExercisesDialog(day, timeSlot.id)}
                            />
                          )
                        }
                        // Otherwise render an empty cell
                        else {
                          return (
                            <td
                              key={`${day}-${timeSlot.id}`}
                              className="border border-gray-800 p-2 text-center hover:bg-gray-800/50 cursor-pointer transition-colors"
                              onClick={() => openExercisesDialog(day, timeSlot.id)}
                            >
                              <span className="text-xs text-gray-500">-</span>
                            </td>
                          )
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Floating notification for upcoming exercise */}
        {upcomingExercise && showNotification && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-72 shadow-lg border-blue-500/20 bg-gray-900 text-white">
              <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-400" />
                  Coming Up Next
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => setShowNotification(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="py-2">
                <p className="font-medium text-base">{upcomingExercise.name}</p>
                <p className="text-sm text-gray-400">
                  Starts in {upcomingExercise.timeUntilStart < 1 ? "less than an hour" : "about an hour"}
                </p>
                <p className="text-sm">
                  {formatTimeDisplay(upcomingExercise.startTime)} - {formatTimeDisplay(upcomingExercise.endTime)}
                </p>
                <p className="text-xs mt-1 text-gray-300">
                  {upcomingExercise.sets} sets × {upcomingExercise.reps} reps
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Dialog for viewing exercises */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>
              {selectedSlot
                ? `${selectedSlot.day} at ${TIME_SLOTS.find((t) => t.id === selectedSlot.time)?.label}`
                : "Exercises"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">Exercises scheduled for this time slot</DialogDescription>
          </DialogHeader>

          {selectedExercises.length > 0 ? (
            <div className="space-y-4">
              {selectedExercises.map((exercise, index) => (
                <div key={index} className="p-3 border border-gray-800 rounded-md bg-gray-800/50">
                  <h3 className="font-medium">{exercise.name}</h3>
                  {(exercise.sets || exercise.reps) && (
                    <p className="text-sm mt-1">
                      {exercise.sets && exercise.reps ? `${exercise.sets} sets × ${exercise.reps} reps` : ""}
                      {exercise.weight ? ` @ ${exercise.weight}` : ""}
                    </p>
                  )}
                  {(exercise.startTime || exercise.endTime) && (
                    <p className="text-sm text-blue-400 mt-1">
                      <Clock className="inline-block h-3 w-3 mr-1" />
                      {formatTimeDisplay(exercise.startTime || "")} - {formatTimeDisplay(exercise.endTime || "")}
                    </p>
                  )}
                  {exercise.notes && <p className="text-sm text-gray-400 mt-1">{exercise.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-400">No exercises scheduled for this time slot.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

