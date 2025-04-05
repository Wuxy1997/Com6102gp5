"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AlertCircle, Award, Trophy, Star, Target, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

// Import the toast component
import { useToast } from "@/components/ui/use-toast"

export default function AchievementsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [achievements, setAchievements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Add the toast hook in the component
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const fetchAchievements = async () => {
    if (user) {
      try {
        setIsLoading(true)
        const achievementsRes = await fetch("/api/achievements")
        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json()
          setAchievements(achievementsData)
        } else {
          const errorData = await achievementsRes.json()
          setError(errorData.error || "Failed to fetch achievements")
        }
      } catch (error) {
        console.error("Error fetching achievements:", error)
        setError("An error occurred while fetching your achievements")
      } finally {
        setIsLoading(false)
      }
    }
  }

  // After fetching achievements, check if there are any new ones
  // Add this after the fetchAchievements function:

  const checkForNewAchievements = async () => {
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
      })
      if (res.ok) {
        const data = await res.json()
        if (data.newAchievements && data.newAchievements.length > 0) {
          // Show toast for each new achievement
          data.newAchievements.forEach((achievement: any) => {
            toast({
              title: "New Achievement Unlocked!",
              description: `${achievement.name}: ${achievement.description}`,
              duration: 5000,
            })
          })
          // Refresh achievements list
          fetchAchievements()
        }
      }
    } catch (error) {
      console.error("Error checking for new achievements:", error)
    }
  }

  // Call this in the useEffect after fetchAchievements
  useEffect(() => {
    if (user) {
      fetchAchievements()
      checkForNewAchievements() // Add this line
    }
  }, [user])

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get icon component based on icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "award":
        return <Award className="h-8 w-8" />
      case "trophy":
        return <Trophy className="h-8 w-8" />
      case "star":
        return <Star className="h-8 w-8" />
      case "target":
        return <Target className="h-8 w-8" />
      case "flame":
        return <Zap className="h-8 w-8" />
      default:
        return <Award className="h-8 w-8" />
    }
  }

  // Calculate total points and progress
  const totalPoints = achievements.reduce((sum, achievement) => {
    return sum + (achievement.earned ? achievement.points : 0)
  }, 0)

  const maxPoints = achievements.reduce((sum, achievement) => sum + achievement.points, 0)
  const progressPercentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Achievements</h1>
            <p className="text-muted-foreground">Track your fitness milestones and earn rewards</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                <CardDescription>
                  You've earned {totalPoints} out of {maxPoints} possible points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {achievements.filter((a) => a.earned).length} of {achievements.length} achievements unlocked
                    </span>
                    <span>{Math.round(progressPercentage)}% complete</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className={`overflow-hidden ${achievement.earned ? "border-primary" : "opacity-75 dark:opacity-50"}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{achievement.name}</CardTitle>
                      <div
                        className={`flex items-center justify-center rounded-full w-10 h-10 ${
                          achievement.earned
                            ? "bg-primary/20 text-primary"
                            : "bg-gray-200 text-gray-400 dark:bg-gray-700"
                        }`}
                      >
                        {getIconComponent(achievement.icon)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                        <span className="text-sm font-medium">{achievement.points} points</span>
                      </div>
                      {achievement.earned ? (
                        <div className="text-xs text-primary">Earned on {formatDate(achievement.earnedAt)}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Not yet earned</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

