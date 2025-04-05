"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AlertCircle, Plus, Save, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

// Generate time options for select dropdown (30 min intervals)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? "00" : "30"
  const amPm = hour < 12 ? "am" : "pm"
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return {
    value: `${hour.toString().padStart(2, "0")}:${minute}`,
    label: `${hour12}:${minute} ${amPm}`,
  }
})

// Exercise type for the calendar
type CalendarExercise = {
  id: string
  name: string
  sets?: string
  reps?: string
  weight?: string
  duration?: string
  notes?: string
  startTime: string
  endTime: string
}

// Workout slot for the calendar
type WorkoutSlot = {
  day: string
  time: string
  exercises: CalendarExercise[]
}

export default function CalendarWorkoutPlanPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Plan details
  const [planData, setPlanData] = useState({
    name: "My Weekly Schedule",
    description: "My personal workout schedule for the week",
    difficulty: "intermediate",
    isPublic: false,
    tags: "schedule, weekly",
  })

  // Workout slots
  const [workoutSlots, setWorkoutSlots] = useState<WorkoutSlot[]>([])

  // Dialog state for adding/editing exercises
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null)
  const [currentExercises, setCurrentExercises] = useState<CalendarExercise[]>([])
  const [newExercise, setNewExercise] = useState<CalendarExercise>({
    id: "",
    name: "",
    sets: "",
    reps: "",
    weight: "",
    duration: "",
    notes: "",
    startTime: "08:00",
    endTime: "09:00",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handlePlanDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPlanData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setPlanData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setPlanData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleNewExerciseChange = (field: keyof CalendarExercise, value: string) => {
    setNewExercise((prev) => ({ ...prev, [field]: value }))
  }

  const openSlotDialog = (day: string, time: string) => {
    setSelectedSlot({ day, time })

    // Find existing exercises for this slot
    const slot = workoutSlots.find((slot) => slot.day === day && slot.time === time)
    if (slot) {
      setCurrentExercises(slot.exercises)
    } else {
      setCurrentExercises([])
    }

    // Set default start and end times based on the selected time slot
    const hour = Number.parseInt(time.split(":")[0])
    const nextHour = (hour + 1) % 24

    // Reset new exercise form
    setNewExercise({
      id: Date.now().toString(),
      name: "",
      sets: "",
      reps: "",
      weight: "",
      duration: "",
      notes: "",
      startTime: time,
      endTime: `${nextHour.toString().padStart(2, "0")}:00`,
    })

    setDialogOpen(true)
  }

  const validateTimeRange = (startTime: string, endTime: string): boolean => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    return endMinutes > startMinutes
  }

  const addExerciseToSlot = () => {
    if (!newExercise.name) {
      toast({
        title: "Exercise name required",
        description: "Please enter a name for the exercise",
        variant: "destructive",
      })
      return
    }

    if (!validateTimeRange(newExercise.startTime, newExercise.endTime)) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    setCurrentExercises((prev) => [...prev, newExercise])

    // Reset form for next exercise
    setNewExercise({
      id: Date.now().toString(),
      name: "",
      sets: "",
      reps: "",
      weight: "",
      duration: "",
      notes: "",
      startTime: newExercise.startTime,
      endTime: newExercise.endTime,
    })
  }

  const removeExerciseFromSlot = (id: string) => {
    setCurrentExercises((prev) => prev.filter((ex) => ex.id !== id))
  }

  const saveSlotExercises = () => {
    if (!selectedSlot) return

    const { day, time } = selectedSlot

    // Remove existing slot if there is one
    const filteredSlots = workoutSlots.filter((slot) => !(slot.day === day && slot.time === time))

    // Only add the slot if there are exercises
    if (currentExercises.length > 0) {
      setWorkoutSlots([
        ...filteredSlots,
        {
          day,
          time,
          exercises: currentExercises,
        },
      ])
    } else {
      setWorkoutSlots(filteredSlots)
    }

    setDialogOpen(false)
  }

  const formatTimeDisplay = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "pm" : "am"
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate form
    if (!planData.name.trim()) {
      setError("Plan name is required")
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare data for API
      const tagsArray = planData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Convert calendar format to the workout plan format
      const weeks = [
        {
          name: "Weekly Schedule",
          days: DAYS_OF_WEEK.map((day) => {
            // Get all slots for this day
            const daySlots = workoutSlots.filter((slot) => slot.day === day)

            return {
              name: day,
              exercises: daySlots.flatMap((slot) =>
                slot.exercises.map((exercise) => ({
                  name: `${exercise.name} (${formatTimeDisplay(exercise.startTime)}-${formatTimeDisplay(exercise.endTime)})`,
                  sets: exercise.sets || "",
                  reps: exercise.reps || "",
                  weight: exercise.weight || "",
                  notes: exercise.notes
                    ? `${exercise.notes}${exercise.duration ? ` - Duration: ${exercise.duration}` : ""}`
                    : exercise.duration
                      ? `Duration: ${exercise.duration}`
                      : "",
                  startTime: exercise.startTime,
                  endTime: exercise.endTime,
                })),
              ),
            }
          }),
        },
      ]

      const workoutPlanData = {
        name: planData.name,
        description: planData.description,
        difficulty: planData.difficulty,
        isPublic: planData.isPublic,
        tags: tagsArray,
        weeks: weeks,
        isCalendarView: true,
      }

      // Send to API
      const response = await fetch("/api/workout-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutPlanData),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Workout Plan Created",
          description: "Your weekly workout schedule has been successfully created",
        })
        router.push(`/workout-plans/${data._id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create workout plan")
      }
    } catch (error) {
      console.error("Error creating workout plan:", error)
      setError("An error occurred while creating the workout plan")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get all exercises for a specific day
  const getDayExercises = (day: string): CalendarExercise[] => {
    const allExercises: CalendarExercise[] = []
    workoutSlots.forEach((slot) => {
      if (slot.day === day) {
        allExercises.push(...slot.exercises)
      }
    })
    return allExercises
  }

  // Check if a time slot has an exercise that starts at exactly this time
  const getExercisesStartingAt = (day: string, timeSlot: string): CalendarExercise[] => {
    const dayExercises = getDayExercises(day)
    return dayExercises.filter((ex) => ex.startTime === timeSlot)
  }

  // Check if a time slot is in the middle of an exercise
  const getExercisesCoveringTimeSlot = (day: string, timeSlot: string): CalendarExercise[] => {
    const dayExercises = getDayExercises(day)
    const [slotHour, slotMinute] = timeSlot.split(":").map(Number)
    const slotMinutes = slotHour * 60 + (slotMinute || 0)

    return dayExercises.filter((ex) => {
      const [startHour, startMinute] = ex.startTime.split(":").map(Number)
      const [endHour, endMinute] = ex.endTime.split(":").map(Number)

      const startMinutes = startHour * 60 + (startMinute || 0)
      const endMinutes = endHour * 60 + (endMinute || 0)

      // Check if this slot is within the exercise time range (but not the start)
      return slotMinutes > startMinutes && slotMinutes < endMinutes
    })
  }

  // Calculate the height of an exercise block based on its duration
  const calculateExerciseHeight = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startMinutes = startHour * 60 + (startMinute || 0)
    const endMinutes = endHour * 60 + (endMinute || 0)

    // Calculate duration in hours (each row is 1 hour)
    return (endMinutes - startMinutes) / 60
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
            <h1 className="text-3xl font-bold">Create Weekly Workout Schedule</h1>
            <p className="text-muted-foreground">Plan your workouts for each day of the week</p>
          </div>
          <div className="mt-4 md:mt-0 space-x-2">
            <Button variant="outline" onClick={() => router.push("/workout-plans")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Plan Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Schedule Details</CardTitle>
              <CardDescription>Basic information about your workout schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={planData.name}
                  onChange={handlePlanDataChange}
                  placeholder="e.g., My Weekly Workout Schedule"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={planData.description}
                  onChange={handlePlanDataChange}
                  placeholder="Describe your workout schedule..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={planData.difficulty} onValueChange={(value) => handleSelectChange("difficulty", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={planData.tags}
                  onChange={handlePlanDataChange}
                  placeholder="e.g., schedule, weekly, routine"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={planData.isPublic}
                  onCheckedChange={(checked) => handleSwitchChange("isPublic", checked)}
                />
                <Label htmlFor="isPublic">Make this schedule public</Label>
              </div>
            </CardContent>
          </Card>

          {/* Calendar View */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Click on a time slot to add exercises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted sticky left-0 z-10">Time</th>
                      {DAYS_OF_WEEK.map((day) => (
                        <th key={day} className="border p-2 bg-muted">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((timeSlot) => (
                      <tr key={timeSlot.id}>
                        <td className="border p-2 bg-muted font-medium text-sm sticky left-0 z-10">{timeSlot.label}</td>
                        {DAYS_OF_WEEK.map((day) => {
                          const exercisesStartingHere = getExercisesStartingAt(day, timeSlot.id)
                          const exercisesCoveringHere = getExercisesCoveringTimeSlot(day, timeSlot.id)

                          // If there are exercises starting at this time slot, render them
                          if (exercisesStartingHere.length > 0) {
                            return (
                              <td
                                key={`${day}-${timeSlot.id}`}
                                className="border p-0 relative"
                                onClick={() => openSlotDialog(day, timeSlot.id)}
                              >
                                {exercisesStartingHere.map((exercise, index) => {
                                  const height = calculateExerciseHeight(exercise.startTime, exercise.endTime)
                                  return (
                                    <div
                                      key={exercise.id}
                                      className="absolute inset-x-0 bg-primary/20 hover:bg-primary/30 transition-colors p-1 overflow-hidden text-xs"
                                      style={{
                                        top: 0,
                                        height: `${height * 100}%`,
                                        zIndex: 1,
                                      }}
                                    >
                                      <div className="font-medium truncate">{exercise.name}</div>
                                      <div className="text-muted-foreground truncate">
                                        {formatTimeDisplay(exercise.startTime)} - {formatTimeDisplay(exercise.endTime)}
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
                                className="border p-0 bg-primary/10"
                                onClick={() => openSlotDialog(day, timeSlot.id)}
                              />
                            )
                          }
                          // Otherwise render an empty cell
                          else {
                            return (
                              <td
                                key={`${day}-${timeSlot.id}`}
                                className="border p-2 text-center hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => openSlotDialog(day, timeSlot.id)}
                              >
                                <Button variant="ghost" size="sm" className="h-6 text-xs">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
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
        </div>
      </main>

      {/* Dialog for adding/editing exercises */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSlot
                ? `${selectedSlot.day} at ${TIME_SLOTS.find((t) => t.id === selectedSlot.time)?.label}`
                : "Add Exercises"}
            </DialogTitle>
            <DialogDescription>Add exercises to this time slot</DialogDescription>
          </DialogHeader>

          {/* Current exercises in this slot */}
          {currentExercises.length > 0 && (
            <div className="space-y-4 mb-4">
              <h3 className="font-medium">Current Exercises</h3>
              <div className="space-y-2">
                {currentExercises.map((exercise) => (
                  <div key={exercise.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets && exercise.reps ? `${exercise.sets} sets × ${exercise.reps} reps` : ""}
                        {exercise.weight ? ` @ ${exercise.weight}` : ""}
                        {exercise.duration ? (exercise.sets ? " • " : "") + `Duration: ${exercise.duration}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeDisplay(exercise.startTime)} - {formatTimeDisplay(exercise.endTime)}
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => removeExerciseFromSlot(exercise.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new exercise form */}
          <div className="space-y-4">
            <h3 className="font-medium">Add Exercise</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exerciseName">Exercise Name</Label>
                <Input
                  id="exerciseName"
                  value={newExercise.name}
                  onChange={(e) => handleNewExerciseChange("name", e.target.value)}
                  placeholder="e.g., Bench Press, Running, Yoga"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exerciseSets">Sets</Label>
                  <Input
                    id="exerciseSets"
                    value={newExercise.sets}
                    onChange={(e) => handleNewExerciseChange("sets", e.target.value)}
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exerciseReps">Reps</Label>
                  <Input
                    id="exerciseReps"
                    value={newExercise.reps}
                    onChange={(e) => handleNewExerciseChange("reps", e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exerciseWeight">Weight (optional)</Label>
                  <Input
                    id="exerciseWeight"
                    value={newExercise.weight}
                    onChange={(e) => handleNewExerciseChange("weight", e.target.value)}
                    placeholder="e.g., 50kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exerciseDuration">Duration (optional)</Label>
                  <Input
                    id="exerciseDuration"
                    value={newExercise.duration}
                    onChange={(e) => handleNewExerciseChange("duration", e.target.value)}
                    placeholder="e.g., 30 min"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Select
                    value={newExercise.startTime}
                    onValueChange={(value) => handleNewExerciseChange("startTime", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Select
                    value={newExercise.endTime}
                    onValueChange={(value) => handleNewExerciseChange("endTime", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exerciseNotes">Notes (optional)</Label>
                <Textarea
                  id="exerciseNotes"
                  value={newExercise.notes}
                  onChange={(e) => handleNewExerciseChange("notes", e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              <Button type="button" onClick={addExerciseToSlot} disabled={!newExercise.name}>
                <Plus className="mr-2 h-4 w-4" />
                Add Exercise
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSlotExercises}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

