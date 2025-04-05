"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Target, Plus, Edit, Trash2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Import dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Import form components
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function GoalsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [goals, setGoals] = useState<any[]>([])
  const [healthData, setHealthData] = useState<any[]>([])
  const [exerciseData, setExerciseData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)

  // Form state
  const [goalForm, setGoalForm] = useState({
    type: "weight",
    name: "",
    target: "",
    current: "",
    unit: "",
    deadline: null as Date | null,
    notes: "",
  })

  // Add the toast hook in the component
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setIsLoading(true)

          // Fetch goals
          const goalsRes = await fetch("/api/goals")
          if (goalsRes.ok) {
            const goalsData = await goalsRes.json()
            setGoals(goalsData)
          }

          // Fetch health data for recommendations
          const healthRes = await fetch("/api/health-data")
          if (healthRes.ok) {
            const healthData = await healthRes.json()
            setHealthData(healthData)
          }

          // Fetch exercise data for recommendations
          const exerciseRes = await fetch("/api/exercise-data")
          if (exerciseRes.ok) {
            const exerciseData = await exerciseRes.json()
            setExerciseData(exerciseData)
          }
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Handle goal form change
  const handleGoalFormChange = (field: string, value: any) => {
    setGoalForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Reset goal form
  const resetGoalForm = () => {
    setGoalForm({
      type: "weight",
      name: "",
      target: "",
      current: "",
      unit: "",
      deadline: null,
      notes: "",
    })
    setEditingGoal(null)
  }

  // Open goal dialog for editing
  const openEditGoalDialog = (goal: any) => {
    setEditingGoal(goal)
    setGoalForm({
      type: goal.type,
      name: goal.name,
      target: goal.target.toString(),
      current: goal.current.toString(),
      unit: goal.unit,
      deadline: goal.deadline ? new Date(goal.deadline) : null,
      notes: goal.notes,
    })
    setGoalDialogOpen(true)
  }

  // Handle goal form submission
  const handleGoalSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Validate form
      if (!goalForm.type || !goalForm.target) {
        toast({
          title: "Validation Error",
          description: "Goal type and target are required",
          variant: "destructive",
        })
        return
      }

      // Prepare data
      const data = {
        ...goalForm,
        target: Number(goalForm.target),
        current: goalForm.current ? Number(goalForm.current) : 0,
      }

      let response

      if (editingGoal) {
        // Update existing goal
        response = await fetch("/api/goals", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _id: editingGoal._id,
            ...data,
          }),
        })
      } else {
        // Create new goal
        response = await fetch("/api/goals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
      }

      if (response.ok) {
        const result = await response.json()

        // Update goals list
        if (editingGoal) {
          setGoals((prev) => prev.map((g) => (g._id === editingGoal._id ? result : g)))
        } else {
          setGoals((prev) => [result, ...prev])
        }

        // Show success message
        toast({
          title: editingGoal ? "Goal Updated" : "Goal Created",
          description: editingGoal
            ? "Your goal has been updated successfully"
            : "Your new goal has been created successfully",
        })

        // Close dialog and reset form
        setGoalDialogOpen(false)
        resetGoalForm()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to save goal")
      }
    } catch (error: any) {
      console.error("Error saving goal:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save goal",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle goal deletion
  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove goal from list
        setGoals((prev) => prev.filter((g) => g._id !== goalId))

        // Show success message
        toast({
          title: "Goal Deleted",
          description: "Your goal has been deleted successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete goal")
      }
    } catch (error: any) {
      console.error("Error deleting goal:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive",
      })
    }
  }

  // Get the latest health data
  const getLatestHealthData = () => {
    if (healthData.length === 0) {
      return {
        weight: 70,
        bmi: 22.5,
        heartRate: 68,
      }
    }

    // Sort by date and get the most recent
    const sortedData = [...healthData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return sortedData[0]
  }

  const latestHealth = getLatestHealthData()

  // Calculate total calories burned in the last 7 days
  const calculateCaloriesBurned = () => {
    if (exerciseData.length === 0) {
      return 0
    }

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return exerciseData
      .filter((item) => new Date(item.date) >= oneWeekAgo)
      .reduce((total, item) => total + (item.caloriesBurned || 0), 0)
  }

  // Set default goal name based on type
  useEffect(() => {
    if (goalForm.type && !editingGoal) {
      let name = ""
      let unit = ""

      switch (goalForm.type) {
        case "weight":
          name = "Weight Goal"
          unit = "kg"
          break
        case "exercise":
          name = "Exercise Goal"
          unit = "minutes/week"
          break
        case "sleep":
          name = "Sleep Goal"
          unit = "hours/night"
          break
        case "nutrition":
          name = "Nutrition Goal"
          unit = "calories/day"
          break
        case "water":
          name = "Water Intake Goal"
          unit = "glasses/day"
          break
        case "steps":
          name = "Daily Steps Goal"
          unit = "steps/day"
          break
        case "calories":
          name = "Calories Burned Goal"
          unit = "kcal/week"
          break
        default:
          name = "Custom Goal"
          unit = ""
      }

      setGoalForm((prev) => ({
        ...prev,
        name,
        unit,
      }))
    }
  }, [goalForm.type, editingGoal])

  // Get goal icon based on type
  const getGoalIcon = (type: string) => {
    switch (type) {
      case "weight":
        return <Target className="h-5 w-5 text-blue-500" />
      case "exercise":
        return <Target className="h-5 w-5 text-green-500" />
      case "sleep":
        return <Target className="h-5 w-5 text-purple-500" />
      case "nutrition":
        return <Target className="h-5 w-5 text-yellow-500" />
      case "water":
        return <Target className="h-5 w-5 text-cyan-500" />
      case "steps":
        return <Target className="h-5 w-5 text-orange-500" />
      case "calories":
        return <Target className="h-5 w-5 text-red-500" />
      default:
        return <Target className="h-5 w-5 text-primary" />
    }
  }

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground">Set and track your health and fitness goals</p>
          </div>
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetGoalForm()
                  setGoalDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Set New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingGoal ? "Edit Goal" : "Set New Goal"}</DialogTitle>
                <DialogDescription>
                  {editingGoal
                    ? "Update your goal details below"
                    : "Create a new health or fitness goal to track your progress"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="goalType" className="text-right">
                    Goal Type
                  </Label>
                  <Select
                    value={goalForm.type}
                    onValueChange={(value) => handleGoalFormChange("type", value)}
                    disabled={!!editingGoal}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="exercise">Exercise</SelectItem>
                      <SelectItem value="sleep">Sleep</SelectItem>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="water">Water Intake</SelectItem>
                      <SelectItem value="steps">Steps</SelectItem>
                      <SelectItem value="calories">Calories Burned</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="goalName" className="text-right">
                    Goal Name
                  </Label>
                  <Input
                    id="goalName"
                    value={goalForm.name}
                    onChange={(e) => handleGoalFormChange("name", e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="goalTarget" className="text-right">
                    Target
                  </Label>
                  <Input
                    id="goalTarget"
                    type="number"
                    value={goalForm.target}
                    onChange={(e) => handleGoalFormChange("target", e.target.value)}
                    className="col-span-2"
                  />
                  <Input
                    id="goalUnit"
                    value={goalForm.unit}
                    onChange={(e) => handleGoalFormChange("unit", e.target.value)}
                    placeholder="Unit"
                    className="col-span-1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="goalCurrent" className="text-right">
                    Current
                  </Label>
                  <Input
                    id="goalCurrent"
                    type="number"
                    value={goalForm.current}
                    onChange={(e) => handleGoalFormChange("current", e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="goalDeadline" className="text-right">
                    Deadline
                  </Label>
                  <div className="col-span-3">
                    <DatePicker date={goalForm.deadline} setDate={(date) => handleGoalFormChange("deadline", date)} />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="goalNotes" className="text-right pt-2">
                    Notes
                  </Label>
                  <Textarea
                    id="goalNotes"
                    value={goalForm.notes}
                    onChange={(e) => handleGoalFormChange("notes", e.target.value)}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGoalSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingGoal ? "Update Goal" : "Create Goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="active" className="mb-6">
          <TabsList>
            <TabsTrigger value="active">Active Goals</TabsTrigger>
            <TabsTrigger value="completed">Completed Goals</TabsTrigger>
            <TabsTrigger value="suggested">Suggested Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : goals.filter((g) => !g.isCompleted).length > 0 ? (
                goals
                  .filter((g) => !g.isCompleted)
                  .map((goal) => (
                    <Card key={goal._id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            {getGoalIcon(goal.type)}
                            <CardTitle className="ml-2">{goal.name}</CardTitle>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditGoalDialog(goal)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>
                          Target: {goal.target} {goal.unit} •
                          {goal.deadline ? ` Due: ${formatDate(goal.deadline)}` : " No deadline"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">
                              Progress: {goal.current} / {goal.target} {goal.unit}
                            </span>
                            <span className="text-sm font-medium">
                              {Math.min(100, Math.round((goal.current / goal.target) * 100))}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            // Mark as completed if progress is 100%
                            if (goal.current >= goal.target) {
                              fetch("/api/goals", {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  _id: goal._id,
                                  isCompleted: true,
                                }),
                              })
                                .then((res) => {
                                  if (res.ok) {
                                    setGoals((prev) =>
                                      prev.map((g) => (g._id === goal._id ? { ...g, isCompleted: true } : g)),
                                    )
                                    toast({
                                      title: "Goal Completed",
                                      description: `Congratulations on completing your ${goal.name}!`,
                                    })
                                  }
                                })
                                .catch((err) => console.error("Error marking goal as complete:", err))
                            } else {
                              // Open edit dialog to update progress
                              openEditGoalDialog(goal)
                            }
                          }}
                        >
                          {goal.current >= goal.target ? "Mark as Completed" : "Update Progress"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">
                    No active goals set yet. Click "Set New Goal" to get started.
                  </p>
                  <Button
                    onClick={() => {
                      resetGoalForm()
                      setGoalDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Set New Goal
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : goals.filter((g) => g.isCompleted).length > 0 ? (
                goals
                  .filter((g) => g.isCompleted)
                  .map((goal) => (
                    <Card key={goal._id} className="overflow-hidden bg-gray-50 dark:bg-gray-800">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <CardTitle className="ml-2">{goal.name}</CardTitle>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription>
                          Target: {goal.target} {goal.unit} • Completed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div className="bg-green-500 h-2.5 rounded-full w-full"></div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{goal.notes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No completed goals yet. Complete your active goals to see them here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="suggested">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weight Management</CardTitle>
                  <CardDescription>Reach a healthy weight</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on your current weight of {latestHealth.weight || 70}kg and BMI of {latestHealth.bmi || 22.5},
                    we recommend setting a goal to reach 68kg in the next 3 months.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      resetGoalForm()
                      setGoalForm({
                        type: "weight",
                        name: "Weight Management Goal",
                        target: "68",
                        current: latestHealth.weight?.toString() || "70",
                        unit: "kg",
                        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                        notes: "Reach a healthy weight of 68kg through diet and exercise.",
                      })
                      setGoalDialogOpen(true)
                    }}
                  >
                    Set This Goal
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Exercise</CardTitle>
                  <CardDescription>Improve cardiovascular health</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    To improve cardiovascular health, aim for at least 150 minutes of moderate exercise per week.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      resetGoalForm()
                      setGoalForm({
                        type: "exercise",
                        name: "Weekly Exercise Goal",
                        target: "150",
                        current: "0",
                        unit: "minutes/week",
                        deadline: null,
                        notes: "Achieve 150 minutes of moderate exercise each week for better health.",
                      })
                      setGoalDialogOpen(true)
                    }}
                  >
                    Set This Goal
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Water Intake</CardTitle>
                  <CardDescription>Stay properly hydrated</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Staying hydrated is essential. We recommend drinking at least 8 glasses of water daily.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      resetGoalForm()
                      setGoalForm({
                        type: "water",
                        name: "Daily Water Intake Goal",
                        target: "8",
                        current: "0",
                        unit: "glasses/day",
                        deadline: null,
                        notes: "Drink 8 glasses of water daily for proper hydration.",
                      })
                      setGoalDialogOpen(true)
                    }}
                  >
                    Set This Goal
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calories Burned</CardTitle>
                  <CardDescription>Increase weekly calorie expenditure</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    To support weight management, aim to burn at least 2000 calories per week through exercise. You've
                    burned approximately {calculateCaloriesBurned()} calories in the past week.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      resetGoalForm()
                      setGoalForm({
                        type: "calories",
                        name: "Weekly Calories Burned Goal",
                        target: "2000",
                        current: calculateCaloriesBurned().toString(),
                        unit: "kcal/week",
                        deadline: null,
                        notes: "Burn at least 2000 calories per week through various exercises.",
                      })
                      setGoalDialogOpen(true)
                    }}
                  >
                    Set This Goal
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Steps</CardTitle>
                  <CardDescription>Increase daily activity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Walking 10,000 steps daily can significantly improve your overall health and help with weight
                    management.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      resetGoalForm()
                      setGoalForm({
                        type: "steps",
                        name: "Daily Steps Goal",
                        target: "10000",
                        current: "0",
                        unit: "steps/day",
                        deadline: null,
                        notes: "Walk 10,000 steps daily for better health and increased activity.",
                      })
                      setGoalDialogOpen(true)
                    }}
                  >
                    Set This Goal
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sleep Quality</CardTitle>
                  <CardDescription>Improve sleep duration and quality</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Getting 7-9 hours of quality sleep each night is essential for recovery, hormone balance, and
                    overall health.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      resetGoalForm()
                      setGoalForm({
                        type: "sleep",
                        name: "Sleep Quality Goal",
                        target: "8",
                        current: "0",
                        unit: "hours/night",
                        deadline: null,
                        notes: "Get 8 hours of quality sleep each night for better recovery and health.",
                      })
                      setGoalDialogOpen(true)
                    }}
                  >
                    Set This Goal
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

