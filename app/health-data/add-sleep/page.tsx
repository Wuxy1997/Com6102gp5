"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddSleepPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    sleepHours: "",
    sleepQuality: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/health-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sleepHours: formData.sleepHours,
          sleepQuality: formData.sleepQuality,
          notes: formData.notes,
          date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Sleep data saved",
          description: "Your sleep data has been successfully recorded",
        })

        setTimeout(() => {
          router.push("/health-data")
        }, 500)
      } else {
        const data = await response.json()
        setError(data.error || "Error saving data")
      }
    } catch (error) {
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
          <h1 className="text-3xl font-bold mb-6">Record Sleep</h1>

          <Card>
            <CardHeader>
              <CardTitle>Sleep Details</CardTitle>
              <CardDescription>Record your sleep duration and quality</CardDescription>
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
                  <Label htmlFor="sleepHours">Sleep Duration (hours)</Label>
                  <Input
                    id="sleepHours"
                    name="sleepHours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="e.g., 7.5"
                    value={formData.sleepHours}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleepQuality">Sleep Quality</Label>
                  <Select value={formData.sleepQuality} onValueChange={(value) => handleSelectChange("sleepQuality", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sleep quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Poor</SelectItem>
                      <SelectItem value="2">2 - Poor</SelectItem>
                      <SelectItem value="3">3 - Fair</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    name="notes"
                    placeholder="Add any additional notes about your sleep..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <CardFooter className="px-0 pt-4">
                  <div className="flex justify-end space-x-2 w-full">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Sleep Data"}
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