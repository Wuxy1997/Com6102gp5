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

export default function AddBloodPressurePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
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
          bloodPressureSystolic: formData.bloodPressureSystolic,
          bloodPressureDiastolic: formData.bloodPressureDiastolic,
          heartRate: formData.heartRate,
          notes: formData.notes,
          date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Blood pressure data saved",
          description: "Your blood pressure data has been successfully recorded",
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
          <h1 className="text-3xl font-bold mb-6">Record Blood Pressure</h1>

          <Card>
            <CardHeader>
              <CardTitle>Blood Pressure Details</CardTitle>
              <CardDescription>Record your blood pressure and heart rate measurements</CardDescription>
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
                    <Label htmlFor="bloodPressureSystolic">Systolic (mmHg)</Label>
                    <Input
                      id="bloodPressureSystolic"
                      name="bloodPressureSystolic"
                      type="number"
                      placeholder="e.g., 120"
                      value={formData.bloodPressureSystolic}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodPressureDiastolic">Diastolic (mmHg)</Label>
                    <Input
                      id="bloodPressureDiastolic"
                      name="bloodPressureDiastolic"
                      type="number"
                      placeholder="e.g., 80"
                      value={formData.bloodPressureDiastolic}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input
                    id="heartRate"
                    name="heartRate"
                    type="number"
                    placeholder="e.g., 72"
                    value={formData.heartRate}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    name="notes"
                    placeholder="Add any additional notes..."
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
                      {isSubmitting ? "Saving..." : "Save Blood Pressure Data"}
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