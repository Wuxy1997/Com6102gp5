"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function GoalCompletionToast() {
  const { toast } = useToast()
  const [completedGoals, setCompletedGoals] = useState<any[]>([])

  useEffect(() => {
    // Function to check for newly completed goals
    const checkCompletedGoals = async () => {
      try {
        const response = await fetch("/api/goals/completed", {
          credentials: "include", // Important for NextAuth session
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch completed goals")
        }

        const data = await response.json()

        if (data.completedGoals && data.completedGoals.length > 0) {
          setCompletedGoals(data.completedGoals)

          // Show toast for each newly completed goal
          data.completedGoals.forEach((goal: any) => {
            toast({
              title: "Goal Completed! 🎉",
              description: `You've reached your goal: ${goal.name}`,
              duration: 5000,
            })
          })

          // Mark goals as notified
          const markResponse = await fetch("/api/goals/mark-notified", {
            method: "POST",
            credentials: "include", // Important for NextAuth session
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              goalIds: data.completedGoals.map((g: any) => g._id),
            }),
          })

          if (!markResponse.ok) {
            const errorData = await markResponse.json()
            throw new Error(errorData.error || "Failed to mark goals as notified")
          }
        }
      } catch (error) {
        console.error("Error checking completed goals:", error)
        // Don't show error toast to avoid spamming the user
      }
    }

    // Check when component mounts
    checkCompletedGoals()

    // Set up interval to check periodically
    const interval = setInterval(checkCompletedGoals, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [toast])

  return null // This component doesn't render anything
}

