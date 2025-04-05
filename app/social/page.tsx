"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { AlertCircle, Users, UserPlus, Check, X, Share2, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function SocialPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sharedWorkouts, setSharedWorkouts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("friends")
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)
  const [isAddingWorkout, setIsAddingWorkout] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setIsLoading(true)
          // Fetch friends data
          const friendsRes = await fetch("/api/friends")
          if (friendsRes.ok) {
            const friendsData = await friendsRes.json()
            setFriends(friendsData.friends || [])
            setPendingRequests(friendsData.pendingRequests || [])
          } else {
            const errorData = await friendsRes.json()
            setError(errorData.error || "Failed to fetch friends")
          }

          // Fetch shared workouts
          const sharedWorkoutsRes = await fetch("/api/shared-workouts")
          if (sharedWorkoutsRes.ok) {
            const sharedWorkoutsData = await sharedWorkoutsRes.json()
            setSharedWorkouts(sharedWorkoutsData || [])
          }
        } catch (error) {
          console.error("Error fetching social data:", error)
          setError("An error occurred while fetching your social data")
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [user])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      } else {
        const errorData = await response.json()
        toast({
          title: "Search Error",
          description: errorData.error || "Failed to search users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Search Error",
        description: "An error occurred while searching users",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        toast({
          title: "Friend Request Sent",
          description: "Your friend request has been sent successfully",
        })
        // Update search results to show pending status
        setSearchResults((prev) => prev.map((user) => (user._id === userId ? { ...user, requestSent: true } : user)))
      } else {
        const errorData = await response.json()
        toast({
          title: "Request Error",
          description: errorData.error || "Failed to send friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending friend request:", error)
      toast({
        title: "Request Error",
        description: "An error occurred while sending friend request",
        variant: "destructive",
      })
    }
  }

  const respondToFriendRequest = async (requestId: string, status: "accepted" | "rejected") => {
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: status === "accepted" ? "Friend Request Accepted" : "Friend Request Rejected",
          description:
            status === "accepted" ? "You are now friends with this user" : "You have rejected this friend request",
        })

        // Update UI
        if (status === "accepted") {
          const acceptedRequest = pendingRequests.find((req) => req.requestId === requestId)
          if (acceptedRequest) {
            setFriends((prev) => [...prev, acceptedRequest])
          }
        }
        setPendingRequests((prev) => prev.filter((req) => req.requestId !== requestId))
      } else {
        const errorData = await response.json()
        toast({
          title: "Response Error",
          description: errorData.error || "Failed to respond to friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error responding to friend request:", error)
      toast({
        title: "Response Error",
        description: "An error occurred while responding to friend request",
        variant: "destructive",
      })
    }
  }

  const removeFriend = async (friendId: string) => {
    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Friend Removed",
          description: "You have removed this friend",
        })
        setFriends((prev) => prev.filter((friend) => friend._id !== friendId))
      } else {
        const errorData = await response.json()
        toast({
          title: "Remove Error",
          description: errorData.error || "Failed to remove friend",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing friend:", error)
      toast({
        title: "Remove Error",
        description: "An error occurred while removing friend",
        variant: "destructive",
      })
    }
  }

  const addToMyWorkouts = async (workout: any) => {
    setSelectedWorkout(workout)
    setIsAddingWorkout(true)
  }

  const saveWorkoutToMyPlans = async () => {
    if (!selectedWorkout) return

    try {
      // Create a new workout plan from the shared workout
      const workoutPlan = {
        name: `${selectedWorkout.title} (from ${selectedWorkout.sharedBy.name})`,
        description: selectedWorkout.description || "",
        weeks: [
          {
            name: "Week 1",
            days: [
              {
                name: "Day 1",
                exercises: selectedWorkout.exercises.map((ex: any) => ({
                  name: ex.name,
                  sets: ex.sets,
                  reps: ex.reps,
                  weight: ex.weight || "",
                  notes: "",
                })),
              },
            ],
          },
        ],
        difficulty: "intermediate",
        tags: ["shared", "friend"],
        isPublic: false,
      }

      const response = await fetch("/api/workout-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutPlan),
      })

      if (response.ok) {
        toast({
          title: "Workout Added",
          description: "The shared workout has been added to your workout plans",
        })
        setIsAddingWorkout(false)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to add workout to your plans",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding workout to plans:", error)
      toast({
        title: "Error",
        description: "An error occurred while adding the workout to your plans",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Social</h1>
            <p className="text-muted-foreground">Connect with friends and share your fitness journey</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="find">Find Friends</TabsTrigger>
            <TabsTrigger value="shared">Shared Workouts</TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            {pendingRequests.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Friend Requests</CardTitle>
                  <CardDescription>Respond to your pending friend requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-4">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" alt={request.name} />
                            <AvatarFallback>{request.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.name}</p>
                            <p className="text-sm text-muted-foreground">{request.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondToFriendRequest(request.requestId, "accepted")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondToFriendRequest(request.requestId, "rejected")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : friends.length === 0 ? (
              <Card className="mb-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Friends Yet</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    You haven't connected with any friends yet. Search for friends to start building your fitness
                    network.
                  </p>
                  <Button onClick={() => setActiveTab("find")}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Find Friends
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend) => (
                  <Card key={friend._id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 mr-4">
                          <AvatarImage src="/placeholder.svg?height=48&width=48" alt={friend.name} />
                          <AvatarFallback>{friend.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{friend.name}</CardTitle>
                          <CardDescription>{friend.email}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {friend.bio && <p className="text-sm text-muted-foreground">{friend.bio}</p>}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => removeFriend(friend._id)}>
                        Remove
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/profile/${friend._id}`}>View Profile</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="find">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Find Friends</CardTitle>
                <CardDescription>Search for users to connect with</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search by name or email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium">Search Results</h3>
                    {searchResults.map((result) => (
                      <div key={result._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-4">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" alt={result.name} />
                            <AvatarFallback>{result.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-muted-foreground">{result.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={result.isFriend || result.requestSent}
                            onClick={() => sendFriendRequest(result._id)}
                          >
                            {result.isFriend ? (
                              "Friends"
                            ) : result.requestSent ? (
                              "Request Sent"
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Add Friend
                              </>
                            )}
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/profile/${result._id}`}>View Profile</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shared">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : sharedWorkouts.length === 0 ? (
              <Card className="mb-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Share2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Shared Workouts</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    Your friends haven't shared any workouts with you yet. Connect with more friends to see their shared
                    workouts.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sharedWorkouts.map((workout) => (
                  <Card key={workout._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{workout.title}</CardTitle>
                          <CardDescription>
                            Shared by{" "}
                            <Link href={`/profile/${workout.sharedBy._id}`} className="hover:underline">
                              {workout.sharedBy.name}
                            </Link>{" "}
                            on {formatDate(workout.sharedAt)}
                          </CardDescription>
                        </div>
                        <Link href={`/profile/${workout.sharedBy._id}`}>
                          <Avatar className="h-10 w-10 cursor-pointer">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" alt={workout.sharedBy.name} />
                            <AvatarFallback>{workout.sharedBy.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{workout.description}</p>
                      <div className="space-y-2">
                        {workout.exercises.map((exercise: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{exercise.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {exercise.sets} sets × {exercise.reps} reps
                              </p>
                            </div>
                            {exercise.weight && <p className="text-sm">{exercise.weight} kg</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => addToMyWorkouts(workout)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add to My Workouts
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog for adding workout to my plans */}
      <Dialog open={isAddingWorkout} onOpenChange={setIsAddingWorkout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to My Workout Plans</DialogTitle>
            <DialogDescription>This will create a new workout plan based on this shared workout.</DialogDescription>
          </DialogHeader>

          {selectedWorkout && (
            <div className="py-4">
              <h3 className="font-medium mb-2">{selectedWorkout.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{selectedWorkout.description}</p>

              <div className="border rounded-md p-3 space-y-2">
                <h4 className="text-sm font-medium">Exercises:</h4>
                {selectedWorkout.exercises.map((exercise: any, index: number) => (
                  <div key={index} className="text-sm">
                    • {exercise.name}: {exercise.sets} sets × {exercise.reps} reps
                    {exercise.weight && ` (${exercise.weight} kg)`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingWorkout(false)}>
              Cancel
            </Button>
            <Button onClick={saveWorkoutToMyPlans}>Add to My Plans</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

