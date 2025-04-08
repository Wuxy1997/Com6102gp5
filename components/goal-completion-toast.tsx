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
        const response = await fetch("/api/goals/completed")
        if (response.ok) {
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
            await fetch("/api/goals/mark-notified", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                goalIds: data.completedGoals.map((g: any) => g._id),
              }),
            })
          }
        }
      } catch (error) {
        console.error("Error checking completed goals:", error)
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

