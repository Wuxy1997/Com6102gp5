"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddExercisePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    type: "",
    duration: "",
    distance: "",
    caloriesBurned: "",
    intensity: 3,
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      console.log("Submitting exercise data:", formData)
      const response = await fetch("/api/exercise-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Exercise data saved:", data)
        toast({
          title: "Exercise data saved",
          description: "Your exercise record has been successfully saved",
        })

        // Force a small delay to ensure the data is saved before redirecting
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      } else {
        const data = await response.json()
        console.error("Error saving exercise data:", data)
        setError(data.error || "Error saving data")
      }
    } catch (err) {
      console.error("Error submitting exercise data:", err)
      setError("An error occurred while submitting data. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const exerciseTypes = [
    { value: "running", label: "Running" },
    { value: "walking", label: "Walking" },
    { value: "cycling", label: "Cycling" },
    { value: "swimming", label: "Swimming" },
    { value: "strength", label: "Strength Training" },
    { value: "yoga", label: "Yoga" },
    { value: "hiit", label: "High-Intensity Interval Training" },
    { value: "other", label: "Other" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Record Exercise Activity</h1>

          <Card>
            <CardHeader>
              <CardTitle>Exercise Details</CardTitle>
              <CardDescription>Please enter your exercise activity details</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Exercise Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exercise type" />
                    </SelectTrigger>
                    <SelectContent>
                      {exerciseTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      placeholder="30"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="distance">Distance (kilometers)</Label>
                    <Input
                      id="distance"
                      name="distance"
                      type="number"
                      step="0.01"
                      placeholder="5.0"
                      value={formData.distance}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caloriesBurned">Calories Burned (kcal)</Label>
                  <Input
                    id="caloriesBurned"
                    name="caloriesBurned"
                    type="number"
                    placeholder="300"
                    value={formData.caloriesBurned}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="intensity">Exercise Intensity</Label>
                    <span>
                      {formData.intensity === 1 && "Very Light"}
                      {formData.intensity === 2 && "Light"}
                      {formData.intensity === 3 && "Moderate"}
                      {formData.intensity === 4 && "Hard"}
                      {formData.intensity === 5 && "Very Hard"}
                    </span>
                  </div>
                  <Slider
                    id="intensity"
                    min={1}
                    max={5}
                    step={1}
                    value={[formData.intensity]}
                    onValueChange={(value) => handleSliderChange("intensity", value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Enter any notes about this exercise session..."
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <CardFooter className="px-0 pt-4">
                  <div className="flex justify-end space-x-2 w-full">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Data"}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

