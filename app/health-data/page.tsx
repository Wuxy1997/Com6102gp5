"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Plus, Weight, Ruler, Heart, Activity } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function HealthDataPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [healthData, setHealthData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

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
          // Fetch health data
          const healthRes = await fetch("/api/health-data")
          if (healthRes.ok) {
            const healthData = await healthRes.json()
            setHealthData(healthData)
            console.log("Fetched health data:", healthData)
          } else {
            const errorData = await healthRes.json()
            setError(errorData.error || "Failed to fetch health data")
          }
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("An error occurred while fetching your health data")
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [user])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Prepare data for weight chart
  const prepareWeightChartData = () => {
    if (healthData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "Weight (kg)",
            data: [],
            borderColor: "rgb(53, 162, 235)",
            backgroundColor: "rgba(53, 162, 235, 0.5)",
          },
        ],
      }
    }

    // Sort data by date
    const sortedData = [...healthData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      labels: sortedData.map((item) => formatDate(item.date)),
      datasets: [
        {
          label: "Weight (kg)",
          data: sortedData.map((item) => item.weight),
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
        },
      ],
    }
  }

  // Prepare data for BMI chart
  const prepareBMIChartData = () => {
    if (healthData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "BMI",
            data: [],
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
          },
        ],
      }
    }

    // Sort data by date
    const sortedData = [...healthData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      labels: sortedData.map((item) => formatDate(item.date)),
      datasets: [
        {
          label: "BMI",
          data: sortedData.map((item) => item.bmi),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
        },
      ],
    }
  }

  // Prepare data for blood pressure chart
  const prepareBloodPressureChartData = () => {
    if (healthData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "Systolic (mmHg)",
            data: [],
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
          {
            label: "Diastolic (mmHg)",
            data: [],
            borderColor: "rgb(53, 162, 235)",
            backgroundColor: "rgba(53, 162, 235, 0.5)",
          },
        ],
      }
    }

    // Sort data by date and filter out entries without blood pressure data
    const sortedData = [...healthData]
      .filter((item) => item.bloodPressureSystolic && item.bloodPressureDiastolic)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      labels: sortedData.map((item) => formatDate(item.date)),
      datasets: [
        {
          label: "Systolic (mmHg)",
          data: sortedData.map((item) => item.bloodPressureSystolic),
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
        {
          label: "Diastolic (mmHg)",
          data: sortedData.map((item) => item.bloodPressureDiastolic),
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  }

  // Get BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-500" }
    if (bmi < 25) return { category: "Normal weight", color: "text-green-500" }
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-500" }
    return { category: "Obese", color: "text-red-500" }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <main className="container mx-auto py-6 px-4 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Health Data Tracker</h1>
            <p className="text-muted-foreground">Track and analyze your health metrics over time</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link href="/health-data/add">
                <Plus className="mr-2 h-4 w-4" />
                Record New Data
              </Link>
            </Button>
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
        ) : healthData.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Health Data Yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                You haven't recorded any health data yet. Start tracking your health metrics to see trends and insights.
              </p>
              <Button asChild>
                <Link href="/health-data/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Your First Health Data
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Latest Weight</CardTitle>
                  <Weight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthData[0]?.weight || "-"} kg</div>
                  <p className="text-xs text-muted-foreground">
                    Recorded on {healthData[0] ? formatDate(healthData[0].date) : "-"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Latest BMI</CardTitle>
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthData[0]?.bmi || "-"}</div>
                  {healthData[0]?.bmi && (
                    <p className={`text-xs ${getBMICategory(healthData[0].bmi).color}`}>
                      {getBMICategory(healthData[0].bmi).category}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Latest Blood Pressure</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthData[0]?.bloodPressureSystolic
                      ? `${healthData[0]?.bloodPressureSystolic}/${healthData[0]?.bloodPressureDiastolic}`
                      : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground">Systolic/Diastolic (mmHg)</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="charts" className="mb-6">
              <TabsList>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="charts">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Weight Trend</CardTitle>
                      <CardDescription>Your weight changes over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Line options={chartOptions} data={prepareWeightChartData()} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>BMI Trend</CardTitle>
                      <CardDescription>Your BMI changes over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Line options={chartOptions} data={prepareBMIChartData()} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Blood Pressure Trend</CardTitle>
                      <CardDescription>Your blood pressure changes over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Line options={chartOptions} data={prepareBloodPressureChartData()} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Health Data History</CardTitle>
                    <CardDescription>All your recorded health data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Weight (kg)</TableHead>
                            <TableHead>Height (cm)</TableHead>
                            <TableHead>BMI</TableHead>
                            <TableHead>Blood Pressure</TableHead>
                            <TableHead>Heart Rate</TableHead>
                            <TableHead>Sleep</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {healthData
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{formatDate(item.date)}</TableCell>
                                <TableCell>{item.weight}</TableCell>
                                <TableCell>{item.height}</TableCell>
                                <TableCell>
                                  <span className={getBMICategory(item.bmi).color}>
                                    {item.bmi} ({getBMICategory(item.bmi).category})
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {item.bloodPressureSystolic && item.bloodPressureDiastolic
                                    ? `${item.bloodPressureSystolic}/${item.bloodPressureDiastolic}`
                                    : "-"}
                                </TableCell>
                                <TableCell>{item.heartRate || "-"}</TableCell>
                                <TableCell>
                                  {item.sleepHours ? (
                                    <>
                                      {item.sleepHours} hrs
                                      {item.sleepQuality && (
                                        <span className="text-xs ml-1">(Quality: {item.sleepQuality}/5)</span>
                                      )}
                                    </>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}

