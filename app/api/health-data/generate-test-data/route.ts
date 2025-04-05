import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"

export async function POST() {
  try {
    const sessionId = cookies().get("sessionId")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("health_app")

    // Find session
    const session = await db.collection("sessions").findOne({ _id: sessionId })

    if (!session || new Date(session.expiresAt) < new Date()) {
      cookies().delete("sessionId")
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    // Generate test data for the past year
    const testData = []
    const now = new Date()

    // Generate daily data for the past week
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(now.getDate() - i)

      // Random weight between 70 and 75 kg
      const weight = 70 + Math.random() * 5

      testData.push({
        userId: session.userId,
        date: date,
        weight: Number.parseFloat(weight.toFixed(1)),
        height: 175,
        bmi: Number.parseFloat((weight / (1.75 * 1.75)).toFixed(2)),
        createdAt: date,
      })
    }

    // Generate weekly data for the past month
    for (let i = 1; i <= 4; i++) {
      const date = new Date()
      date.setDate(now.getDate() - 7 * i)

      // Random weight between 70 and 75 kg with a slight downward trend
      const weight = 70 + Math.random() * 5 + i * 0.2

      testData.push({
        userId: session.userId,
        date: date,
        weight: Number.parseFloat(weight.toFixed(1)),
        height: 175,
        bmi: Number.parseFloat((weight / (1.75 * 1.75)).toFixed(2)),
        createdAt: date,
      })
    }

    // Generate monthly data for the past year
    for (let i = 2; i <= 12; i++) {
      const date = new Date()
      date.setMonth(now.getMonth() - i)

      // Random weight between 70 and 80 kg with a downward trend over the year
      const weight = 75 + Math.random() * 5 + i * 0.3

      testData.push({
        userId: session.userId,
        date: date,
        weight: Number.parseFloat(weight.toFixed(1)),
        height: 175,
        bmi: Number.parseFloat((weight / (1.75 * 1.75)).toFixed(2)),
        createdAt: date,
      })
    }

    // Insert test data
    await db.collection("health_data").insertMany(testData)

    return NextResponse.json({
      success: true,
      message: `Generated ${testData.length} test data points`,
    })
  } catch (error) {
    console.error("Error generating test data:", error)
    return NextResponse.json({ error: "Failed to generate test data" }, { status: 500 })
  }
}

