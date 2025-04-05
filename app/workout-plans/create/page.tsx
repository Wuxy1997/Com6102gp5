"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Plus, Trash2, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Types for workout plan
type Exercise = {
  name: string
  sets: string
  reps: string
  weight?: string
  notes?: string
  startTime?: string
  endTime?: string
}

type WorkoutDay = {
  name: string
  exercises: Exercise[]
}

type Week = {
  name: string
  days: WorkoutDay[]
}

// Generate time options in 30-minute intervals
const generateTimeOptions = () => {
  const options = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourFormatted = hour.toString().padStart(2, "0")
      const minuteFormatted = minute.toString().padStart(2, "0")
      const value = `${hourFormatted}:${minuteFormatted}`

      // Format for display (12-hour format)
      const hourDisplay = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const period = hour >= 12 ? "PM" : "AM"
      const label = `${hourDisplay}:${minuteFormatted} ${period}`

      options.push({ value, label })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export default function CreateWorkoutPlanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [activeWeek, setActiveWeek] = useState(0)
  const [activeDay, setActiveDay] = useState(0)

  // Form state
  const [planData, setPlanData] = useState({
    name: "",
    description: "",
    difficulty: "intermediate",
    isPublic: false,
    tags: "",
  })

  // Weeks state
  const [weeks, setWeeks] = useState<Week[]>([
    {
      name: "Week 1",
      days: [
        {
          name: "Day 1",
          exercises: [],
        },
      ],
    },
  ])

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

  // Week management
  const addWeek = () => {
    const newWeekNumber = weeks.length + 1
    setWeeks((prev) => [
      ...prev,
      {
        name: `Week ${newWeekNumber}`,
        days: [
          {
            name: "Day 1",
            exercises: [],
          },
        ],
      },
    ])
    setActiveWeek(weeks.length)
    setActiveDay(0)
  }

  const updateWeekName = (weekIndex: number, name: string) => {
    setWeeks((prev) => prev.map((week, idx) => (idx === weekIndex ? { ...week, name } : week)))
  }

  const removeWeek = (weekIndex: number) => {
    if (weeks.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one week in your plan",
        variant: "destructive",
      })
      return
    }

    setWeeks((prev) => prev.filter((_, idx) => idx !== weekIndex))
    if (activeWeek >= weekIndex && activeWeek > 0) {
      setActiveWeek(activeWeek - 1)
    }
    setActiveDay(0)
  }

  // Day management
  const addDay = (weekIndex: number) => {
    const newDayNumber = weeks[weekIndex].days.length + 1
    setWeeks((prev) =>
      prev.map((week, idx) =>
        idx === weekIndex
          ? {
              ...week,
              days: [
                ...week.days,
                {
                  name: `Day ${newDayNumber}`,
                  exercises: [],
                },
              ],
            }
          : week,
      ),
    )
    setActiveDay(weeks[weekIndex].days.length)
  }

  const updateDayName = (weekIndex: number, dayIndex: number, name: string) => {
    setWeeks((prev) =>
      prev.map((week, wIdx) =>
        wIdx === weekIndex
          ? {
              ...week,
              days: week.days.map((day, dIdx) => (dIdx === dayIndex ? { ...day, name } : day)),
            }
          : week,
      ),
    )
  }

  const removeDay = (weekIndex: number, dayIndex: number) => {
    if (weeks[weekIndex].days.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one day in your week",
        variant: "destructive",
      })
      return
    }

    setWeeks((prev) =>
      prev.map((week, wIdx) =>
        wIdx === weekIndex
          ? {
              ...week,
              days: week.days.filter((_, dIdx) => dIdx !== dayIndex),
            }
          : week,
      ),
    )
    if (activeDay >= dayIndex && activeDay > 0) {
      setActiveDay(activeDay - 1)
    }
  }

  // Exercise management
  const addExercise = (weekIndex: number, dayIndex: number) => {
    setWeeks((prev) =>
      prev.map((week, wIdx) =>
        wIdx === weekIndex
          ? {
              ...week,
              days: week.days.map((day, dIdx) =>
                dIdx === dayIndex
                  ? {
                      ...day,
                      exercises: [
                        ...day.exercises,
                        {
                          name: "",
                          sets: "3",
                          reps: "10",
                          weight: "",
                          notes: "",
                          startTime: "08:00",
                          endTime: "09:00",
                        },
                      ],
                    }
                  : day,
              ),
            }
          : week,
      ),
    )
  }

  const updateExercise = (
    weekIndex: number,
    dayIndex: number,
    exerciseIndex: number,
    field: keyof Exercise,
    value: string,
  ) => {
    setWeeks((prev) =>
      prev.map((week, wIdx) =>
        wIdx === weekIndex
          ? {
              ...week,
              days: week.days.map((day, dIdx) =>
                dIdx === dayIndex
                  ? {
                      ...day,
                      exercises: day.exercises.map((exercise, eIdx) =>
                        eIdx === exerciseIndex ? { ...exercise, [field]: value } : exercise,
                      ),
                    }
                  : day,
              ),
            }
          : week,
      ),
    )
  }

  const removeExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number) => {
    setWeeks((prev) =>
      prev.map((week, wIdx) =>
        wIdx === weekIndex
          ? {
              ...week,
              days: week.days.map((day, dIdx) =>
                dIdx === dayIndex
                  ? {
                      ...day,
                      exercises: day.exercises.filter((_, eIdx) => eIdx !== exerciseIndex),
                    }
                  : day,
              ),
            }
          : week,
      ),
    )
  }

  // Validate time selection
  const validateTimeSelection = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true

    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    return endMinutes > startMinutes
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate form
    if (!planData.name.trim()) {
      setError("Plan name is required")
      return
    }

    // Validate that each exercise has a name
    let hasEmptyExercise = false
    let hasInvalidTime = false

    weeks.forEach((week) => {
      week.days.forEach((day) => {
        day.exercises.forEach((exercise) => {
          if (!exercise.name.trim()) {
            hasEmptyExercise = true
          }

          if (exercise.startTime && exercise.endTime) {
            if (!validateTimeSelection(exercise.startTime, exercise.endTime)) {
              hasInvalidTime = true
            }
          }
        })
      })
    })

    if (hasEmptyExercise) {
      setError("All exercises must have a name")
      return
    }

    if (hasInvalidTime) {
      setError("End time must be after start time for all exercises")
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare data for API
      const tagsArray = planData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const workoutPlanData = {
        name: planData.name,
        description: planData.description,
        difficulty: planData.difficulty,
        isPublic: planData.isPublic,
        tags: tagsArray,
        weeks: weeks,
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
          description: "Your workout plan has been successfully created",
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Create Workout Plan</h1>
            <p className="text-muted-foreground">Design a structured workout program</p>
          </div>
          <div className="mt-4 md:mt-0 space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Plan"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
              <CardDescription>Basic information about your workout plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={planData.name}
                  onChange={handlePlanDataChange}
                  placeholder="e.g., 12-Week Strength Program"
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
                  placeholder="Describe your workout plan..."
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
                  placeholder="e.g., strength, hypertrophy, full-body"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={planData.isPublic}
                  onCheckedChange={(checked) => handleSwitchChange("isPublic", checked)}
                />
                <Label htmlFor="isPublic">Make this plan public</Label>
              </div>
            </CardContent>
          </Card>

          {/* Workout Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Workout Schedule</CardTitle>
              <CardDescription>Plan your weekly workouts and exercises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Week tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <Tabs value={activeWeek.toString()} onValueChange={(v) => setActiveWeek(Number.parseInt(v))}>
                    <TabsList className="flex-wrap">
                      {weeks.map((week, weekIndex) => (
                        <TabsTrigger key={weekIndex} value={weekIndex.toString()}>
                          {week.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <Button variant="outline" size="sm" onClick={addWeek}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Week
                  </Button>
                </div>

                {/* Active week content */}
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className={weekIndex === activeWeek ? "block" : "hidden"}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          value={week.name}
                          onChange={(e) => updateWeekName(weekIndex, e.target.value)}
                          className="w-40"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeWeek(weekIndex)}
                          disabled={weeks.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Day tabs */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Tabs value={activeDay.toString()} onValueChange={(v) => setActiveDay(Number.parseInt(v))}>
                        <TabsList className="flex-wrap">
                          {week.days.map((day, dayIndex) => (
                            <TabsTrigger key={dayIndex} value={dayIndex.toString()}>
                              {day.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                      <Button variant="outline" size="sm" onClick={() => addDay(weekIndex)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Day
                      </Button>
                    </div>

                    {/* Active day content */}
                    {week.days.map((day, dayIndex) => (
                      <div key={dayIndex} className={dayIndex === activeDay ? "block" : "hidden"}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Input
                              value={day.name}
                              onChange={(e) => updateDayName(weekIndex, dayIndex, e.target.value)}
                              className="w-40"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeDay(weekIndex, dayIndex)}
                              disabled={week.days.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Exercises */}
                        <div className="space-y-4">
                          {day.exercises.length === 0 ? (
                            <div className="text-center py-8 border border-dashed rounded-md">
                              <p className="text-muted-foreground mb-2">No exercises added yet</p>
                              <Button variant="outline" size="sm" onClick={() => addExercise(weekIndex, dayIndex)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Exercise
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-12 gap-2 font-medium text-sm">
                                <div className="col-span-3">Exercise</div>
                                <div className="col-span-1">Sets</div>
                                <div className="col-span-1">Reps</div>
                                <div className="col-span-1">Weight</div>
                                <div className="col-span-5">Time</div>
                                <div className="col-span-1">Actions</div>
                              </div>

                              {day.exercises.map((exercise, exerciseIndex) => (
                                <div key={exerciseIndex} className="grid grid-cols-12 gap-2 items-center">
                                  <div className="col-span-3">
                                    <Input
                                      value={exercise.name}
                                      onChange={(e) =>
                                        updateExercise(weekIndex, dayIndex, exerciseIndex, "name", e.target.value)
                                      }
                                      placeholder="Exercise name"
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Input
                                      value={exercise.sets}
                                      onChange={(e) =>
                                        updateExercise(weekIndex, dayIndex, exerciseIndex, "sets", e.target.value)
                                      }
                                      placeholder="Sets"
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Input
                                      value={exercise.reps}
                                      onChange={(e) =>
                                        updateExercise(weekIndex, dayIndex, exerciseIndex, "reps", e.target.value)
                                      }
                                      placeholder="Reps"
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Input
                                      value={exercise.weight || ""}
                                      onChange={(e) =>
                                        updateExercise(weekIndex, dayIndex, exerciseIndex, "weight", e.target.value)
                                      }
                                      placeholder="Optional"
                                    />
                                  </div>
                                  <div className="col-span-5 flex items-center space-x-2">
                                    <div className="flex-1">
                                      <Select
                                        value={exercise.startTime || "08:00"}
                                        onValueChange={(value) =>
                                          updateExercise(weekIndex, dayIndex, exerciseIndex, "startTime", value)
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Start time" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                          {TIME_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <span className="text-muted-foreground">to</span>
                                    <div className="flex-1">
                                      <Select
                                        value={exercise.endTime || "09:00"}
                                        onValueChange={(value) =>
                                          updateExercise(weekIndex, dayIndex, exerciseIndex, "endTime", value)
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="End time" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                          {TIME_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {exercise.startTime &&
                                      exercise.endTime &&
                                      !validateTimeSelection(exercise.startTime, exercise.endTime) && (
                                        <div className="text-red-500">
                                          <AlertCircle className="h-4 w-4" />
                                        </div>
                                      )}
                                  </div>
                                  <div className="col-span-1 flex justify-end">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removeExercise(weekIndex, dayIndex, exerciseIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              <Button variant="outline" size="sm" onClick={() => addExercise(weekIndex, dayIndex)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Exercise
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Workout Plan"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}

