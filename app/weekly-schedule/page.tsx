"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, Plus, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function WeeklySchedulePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasSchedule, setHasSchedule] = useState(false)
  const [scheduleId, setScheduleId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const checkExistingSchedule = async () => {
      if (user) {
        try {
          setIsLoading(true)
          const response = await fetch("/api/weekly-schedule")

          if (response.ok) {
            const data = await response.json()

            if (data.exists) {
              setHasSchedule(true)
              setScheduleId(data.schedule._id)
              // Redirect to the schedule view
              router.push(`/weekly-schedule/${data.schedule._id}`)
            } else {
              setHasSchedule(false)
            }
          } else {
            const errorData = await response.json()
            setError(errorData.error || "Failed to check weekly schedule")
          }
        } catch (error) {
          console.error("Error checking weekly schedule:", error)
          setError("An error occurred while checking your weekly schedule")
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (user) {
      checkExistingSchedule()
    }
  }, [user, router])

  const handleCreateSchedule = () => {
    router.push("/weekly-schedule/create")
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
            <h1 className="text-3xl font-bold">My Weekly Schedule</h1>
            <p className="text-gray-400">Plan your weekly workout routine</p>
          </div>
        </div>

        {!hasSchedule && (
          <Card className="border-0 bg-gray-900 text-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-16 w-16 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Weekly Schedule Found</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  You haven't created a weekly workout schedule yet. Create one to plan your workouts for each day of
                  the week.
                </p>
                <Button onClick={handleCreateSchedule} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create My Weekly Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

