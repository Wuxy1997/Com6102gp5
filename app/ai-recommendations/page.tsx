"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Brain, Dumbbell, Apple, Heart } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"

export default function AIRecommendationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [recommendations, setRecommendations] = useState({
    exercise: [],
    diet: [],
    health: [],
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      fetchRecommendations()
    }
  }, [user, loading, router])

  const fetchRecommendations = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Generate personalized health, exercise, and diet recommendations based on my data",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(
          data.recommendations || {
            exercise: [
              "Incorporate 30 minutes of moderate cardio 3-4 times per week",
              "Add strength training 2-3 times per week focusing on major muscle groups",
              "Consider yoga or stretching to improve flexibility and reduce stress",
              "Try interval training to boost metabolism and cardiovascular health",
              "Ensure proper warm-up and cool-down for each workout session",
            ],
            diet: [
              "Increase protein intake to support muscle recovery",
              "Add more leafy greens and colorful vegetables to your meals",
              "Consider reducing processed food consumption",
              "Stay hydrated by drinking at least 8 glasses of water daily",
              "Balance your macronutrients for optimal energy throughout the day",
            ],
            health: [
              "Prioritize 7-8 hours of quality sleep each night",
              "Practice stress management techniques like meditation",
              "Consider regular health check-ups to monitor progress",
              "Take short breaks during long periods of sitting",
              "Maintain social connections to support mental wellbeing",
            ],
          },
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch AI recommendations")
      }
    } catch (error) {
      console.error("Error fetching AI recommendations:", error)
      setError("An error occurred while fetching AI recommendations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchRecommendations()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center">
              <Brain className="mr-2 h-6 w-6" />
              {t("aiRecommendations")}
            </h1>
            <Button onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? "Generating..." : "Refresh Recommendations"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="exercise" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exercise" className="flex items-center">
                <Dumbbell className="mr-2 h-4 w-4" />
                Exercise
              </TabsTrigger>
              <TabsTrigger value="diet" className="flex items-center">
                <Apple className="mr-2 h-4 w-4" />
                Diet
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center">
                <Heart className="mr-2 h-4 w-4" />
                Health
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exercise">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Dumbbell className="mr-2 h-5 w-5" />
                    Exercise Recommendations
                  </CardTitle>
                  <CardDescription>
                    Personalized exercise suggestions based on your health data and fitness goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {recommendations.exercise.map((recommendation, index) => (
                        <li key={index} className="p-3 bg-muted rounded-md">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    These recommendations are generated by AI based on your data and general health guidelines.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="diet">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Apple className="mr-2 h-5 w-5" />
                    Diet Recommendations
                  </CardTitle>
                  <CardDescription>
                    Nutrition advice tailored to your health profile and dietary preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {recommendations.diet.map((recommendation, index) => (
                        <li key={index} className="p-3 bg-muted rounded-md">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    These recommendations are generated by AI based on your data and general nutrition guidelines.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="health">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="mr-2 h-5 w-5" />
                    Health Recommendations
                  </CardTitle>
                  <CardDescription>
                    General health and lifestyle suggestions to improve your overall wellbeing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {recommendations.health.map((recommendation, index) => (
                        <li key={index} className="p-3 bg-muted rounded-md">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    These recommendations are generated by AI based on your data and general health guidelines.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

