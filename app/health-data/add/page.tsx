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
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AddHealthDataPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    sleepHours: 7,
    sleepQuality: 3,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
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
      console.log("Submitting health data:", formData)
      const response = await fetch("/api/health-data", {
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
        console.log("Health data saved:", data)
        toast({
          title: "Health data saved",
          description: "Your health data has been successfully recorded",
        })

        // Force a small delay to ensure the data is saved before redirecting
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      } else {
        const data = await response.json()
        console.error("Error saving health data:", data)
        setError(data.error || "Error saving data")
      }
    } catch (err) {
      console.error("Error submitting health data:", err)
      setError("An error occurred while submitting data. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Record Health Data</h1>

          <Card>
            <CardHeader>
              <CardTitle>Health Metrics</CardTitle>
              <CardDescription>Please enter your current health metric data</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      value={formData.weight}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      placeholder="175"
                      value={formData.height}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bloodPressureSystolic">Systolic Pressure (mmHg)</Label>
                    <Input
                      id="bloodPressureSystolic"
                      name="bloodPressureSystolic"
                      type="number"
                      placeholder="120"
                      value={formData.bloodPressureSystolic}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodPressureDiastolic">Diastolic Pressure (mmHg)</Label>
                    <Input
                      id="bloodPressureDiastolic"
                      name="bloodPressureDiastolic"
                      type="number"
                      placeholder="80"
                      value={formData.bloodPressureDiastolic}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input
                    id="heartRate"
                    name="heartRate"
                    type="number"
                    placeholder="70"
                    value={formData.heartRate}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="sleepHours">Sleep Duration (hours)</Label>
                    <span>{formData.sleepHours} hours</span>
                  </div>
                  <Slider
                    id="sleepHours"
                    min={0}
                    max={12}
                    step={0.5}
                    value={[formData.sleepHours]}
                    onValueChange={(value) => handleSliderChange("sleepHours", value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="sleepQuality">Sleep Quality</Label>
                    <span>
                      {formData.sleepQuality === 1 && "Very Poor"}
                      {formData.sleepQuality === 2 && "Poor"}
                      {formData.sleepQuality === 3 && "Average"}
                      {formData.sleepQuality === 4 && "Good"}
                      {formData.sleepQuality === 5 && "Excellent"}
                    </span>
                  </div>
                  <Slider
                    id="sleepQuality"
                    min={1}
                    max={5}
                    step={1}
                    value={[formData.sleepQuality]}
                    onValueChange={(value) => handleSliderChange("sleepQuality", value)}
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

