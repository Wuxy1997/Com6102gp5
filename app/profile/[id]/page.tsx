"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Award, UserPlus, UserCheck, UserMinus, Activity, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isFriend, setIsFriend] = useState(false)
  const [isPendingFriend, setIsPendingFriend] = useState(false)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          setIsLoading(true)
          const response = await fetch(`/api/users/${params.id}`)

          if (response.ok) {
            const data = await response.json()
            setProfile(data)

            // Check if this user is a friend
            console.log("Friend status from API:", data.isFriend)
            setIsFriend(data.isFriend)
            setIsPendingFriend(data.isPendingFriend)

            // Fetch recent activities
            fetchRecentActivities(params.id)

            // Fetch achievements
            fetchAchievements(params.id)

            // Fetch workout plans if it's the current user or a friend
            if (user._id === params.id || data.isFriend) {
              fetchWorkoutPlans(params.id)
            }
          } else {
            const errorData = await response.json()
            setError(errorData.error || "Failed to fetch user profile")
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setError("An error occurred while fetching the user profile")
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (params.id) {
      fetchUserProfile()
    }
  }, [params.id, user])

  const fetchRecentActivities = async (userId: string) => {
    try {
      // Fetch recent activities (exercise, food logs, etc.)
      const response = await fetch(`/api/users/${userId}/activities`)
      if (response.ok) {
        const data = await response.json()
        setRecentActivities(data || [])
      } else {
        console.error("Failed to fetch activities:", response.status)
        setRecentActivities([])
      }
    } catch (error) {
      console.error("Error fetching recent activities:", error)
      setRecentActivities([])
    }
  }

  const fetchAchievements = async (userId: string) => {
    try {
      // Fetch user achievements
      const response = await fetch(`/api/achievements?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAchievements(data)
      }
    } catch (error) {
      console.error("Error fetching achievements:", error)
    }
  }

  const fetchWorkoutPlans = async (userId: string) => {
    try {
      // Fetch user's workout plans
      const response = await fetch(`/api/workout-plans?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkoutPlans(data)
      }
    } catch (error) {
      console.error("Error fetching workout plans:", error)
    }
  }

  const handleAddFriend = async () => {
    if (!user || !profile) return

    try {
      setIsActionLoading(true)
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: profile._id }),
      })

      if (response.ok) {
        setIsPendingFriend(true)
        toast({
          title: "Friend Request Sent",
          description: `Friend request sent to ${profile.name}`,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to send friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending friend request:", error)
      toast({
        title: "Error",
        description: "An error occurred while sending the friend request",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRemoveFriend = async () => {
    if (!user || !profile) return

    try {
      setIsActionLoading(true)
      // First, find the friendship ID
      const friendsResponse = await fetch("/api/friends")
      if (!friendsResponse.ok) {
        throw new Error("Failed to fetch friends list")
      }

      const friendsData = await friendsResponse.json()
      const friendship = friendsData.friends.find((f: any) => f._id === profile._id)

      if (!friendship) {
        throw new Error("Friendship not found")
      }

      // Now delete the friendship
      const response = await fetch(`/api/friends/${profile._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setIsFriend(false)
        setIsPendingFriend(false)
        toast({
          title: "Friend Removed",
          description: `${profile.name} has been removed from your friends`,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove friend",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing friend:", error)
      toast({
        title: "Error",
        description: "An error occurred while removing the friend",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Invalid Date"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      console.error("Invalid date format:", dateString)
      return "Invalid Date"
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "Unknown time"

    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSec = Math.round(diffMs / 1000)
      const diffMin = Math.round(diffSec / 60)
      const diffHour = Math.round(diffMin / 60)
      const diffDay = Math.round(diffHour / 24)

      if (diffSec < 60) {
        return `${diffSec} seconds ago`
      } else if (diffMin < 60) {
        return `${diffMin} minutes ago`
      } else if (diffHour < 24) {
        return `${diffHour} hours ago`
      } else if (diffDay < 30) {
        return `${diffDay} days ago`
      } else {
        return formatDate(dateString)
      }
    } catch (e) {
      console.error("Error formatting time ago:", e)
      return "Unknown time"
    }
  }

  // Get activity icon
  const getActivityIcon = (type: string) => {
    if (!type) return <Clock className="h-4 w-4 text-gray-500" />

    switch (type.toLowerCase()) {
      case "exercise":
        return <Activity className="h-4 w-4 text-blue-500" />
      case "food":
        return <Calendar className="h-4 w-4 text-green-500" />
      case "workout":
        return <Calendar className="h-4 w-4 text-purple-500" />
      case "achievement":
        return <Trophy className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // Get achievement color
  const getAchievementColor = (level: string) => {
    if (!level) return "bg-gray-200 text-gray-800"

    switch (level.toLowerCase()) {
      case "bronze":
        return "bg-amber-700 text-white"
      case "silver":
        return "bg-gray-400 text-white"
      case "gold":
        return "bg-yellow-500 text-white"
      case "platinum":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/")}>Go Home</Button>
          </div>
        </main>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MainNav />
        <main className="container mx-auto py-6 px-4 pt-20">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-6">The user you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/")}>Go Home</Button>
          </div>
        </main>
      </div>
    )
  }

  const isCurrentUser = user?._id === profile._id
  console.log("Friend status in render:", isFriend, "Pending:", isPendingFriend)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profile.avatar || "/placeholder.svg?height=96&width=96"} alt={profile.name} />
                  <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl text-center">{profile.name}</CardTitle>
                <CardDescription className="text-center">{profile.email}</CardDescription>
                <div className="flex items-center mt-2">
                  <Badge variant="outline" className="mr-2">
                    Joined {formatDate(profile.createdAt)}
                  </Badge>
                  {isFriend && (
                    <Badge variant="secondary">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Friend
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!isCurrentUser && (
                <div className="flex justify-center mt-2">
                  {!isFriend && !isPendingFriend ? (
                    <Button onClick={handleAddFriend} disabled={isActionLoading}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Friend
                    </Button>
                  ) : isPendingFriend ? (
                    <Button variant="outline" disabled>
                      <Clock className="h-4 w-4 mr-2" />
                      Friend Request Sent
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleRemoveFriend} disabled={isActionLoading}>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove Friend
                    </Button>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-sm text-muted-foreground">{profile.bio || "This user hasn't added a bio yet."}</p>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-2">Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{profile.workoutCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Workouts</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{achievements.length}</p>
                    <p className="text-xs text-muted-foreground">Achievements</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="workout-plans">
              <TabsList className="mb-4">
                <TabsTrigger value="workout-plans">Workout Plans</TabsTrigger>
                <TabsTrigger value="recent-activities">Recent Activities</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="workout-plans">
                {isCurrentUser || isFriend ? (
                  workoutPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {workoutPlans.map((plan) => (
                        <Card key={plan._id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <Calendar className="mr-2 h-4 w-4" />
                              <span>{plan.weeks?.length || 0} weeks</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {plan.tags?.map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-primary/10 p-4 mb-4">
                          <Calendar className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Workout Plans</h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                          {isCurrentUser
                            ? "You haven't created any workout plans yet."
                            : `${profile.name} hasn't created any workout plans yet.`}
                        </p>
                        {isCurrentUser && (
                          <Button onClick={() => router.push("/workout-plans/create")}>Create Workout Plan</Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <UserCheck className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Friends Only</h3>
                      <p className="text-muted-foreground text-center mb-6 max-w-md">
                        You need to be friends with {profile.name} to see their workout plans.
                      </p>
                      {!isFriend && !isPendingFriend && (
                        <Button onClick={handleAddFriend} disabled={isActionLoading}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Friend
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="recent-activities">
                {recentActivities.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activities</CardTitle>
                      <CardDescription>
                        {isCurrentUser ? "Your recent activities" : `${profile.name}'s recent activities`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivities.map((activity, index) => (
                          <div key={index} className="flex items-start">
                            <div className="mr-4 mt-1">
                              <div className="rounded-full bg-primary/10 p-2">{getActivityIcon(activity.type)}</div>
                            </div>
                            <div>
                              <p className="font-medium">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <Activity className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No Recent Activities</h3>
                      <p className="text-muted-foreground text-center mb-6 max-w-md">
                        {isCurrentUser
                          ? "You haven't logged any activities yet."
                          : `${profile.name} hasn't logged any activities yet.`}
                      </p>
                      {isCurrentUser && (
                        <Button onClick={() => router.push("/exercise-tracker/add")}>Log an Activity</Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="achievements">
                {achievements.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Achievements</CardTitle>
                      <CardDescription>
                        {isCurrentUser ? "Your earned achievements" : `${profile.name}'s earned achievements`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {achievements.map((achievement) => (
                          <div
                            key={achievement._id}
                            className="flex items-center p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="mr-4">
                              <div className={`rounded-full p-3 ${getAchievementColor(achievement.level)}`}>
                                <Trophy className="h-5 w-5" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">{achievement.name}</p>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              <div className="flex items-center mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {achievement.level}
                                </Badge>
                                <span className="text-xs text-muted-foreground ml-2">
                                  Earned on {formatDate(achievement.earnedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <Award className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No Achievements Yet</h3>
                      <p className="text-muted-foreground text-center mb-6 max-w-md">
                        {isCurrentUser
                          ? "You haven't earned any achievements yet."
                          : `${profile.name} hasn't earned any achievements yet.`}
                      </p>
                      {isCurrentUser && (
                        <Button onClick={() => router.push("/achievements")}>View Available Achievements</Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

