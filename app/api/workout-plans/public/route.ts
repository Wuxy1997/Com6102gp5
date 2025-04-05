import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
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

    // Get public workout plans (excluding the user's own plans)
    const publicPlans = await db
      .collection("workout_plans")
      .find({
        isPublic: true,
        userId: { $ne: session.userId },
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Get creator names
    const creatorIds = [...new Set(publicPlans.map((plan) => plan.userId))]
    const creators = await db
      .collection("users")
      .find({ _id: { $in: creatorIds.map((id) => new ObjectId(id)) } })
      .project({ _id: 1, name: 1 })
      .toArray()

    // Map creator names to plans
    const plansWithCreatorNames = publicPlans.map((plan) => {
      const creator = creators.find((c) => c._id.toString() === plan.userId)
      return {
        ...plan,
        creatorName: creator ? creator.name : "Unknown User",
      }
    })

    return NextResponse.json(plansWithCreatorNames)
  } catch (error) {
    console.error("Error fetching public workout plans:", error)
    return NextResponse.json({ error: "Failed to fetch public workout plans" }, { status: 500 })
  }
}

