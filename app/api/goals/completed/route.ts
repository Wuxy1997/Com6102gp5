import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET() {
  try {
    // Check NextAuth session first
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("health_app")

    // Find user by email
    const user = await db.collection("users").findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find newly completed goals that haven't been notified yet
    const completedGoals = await db
      .collection("goals")
      .find({
        userId: user._id.toString(),
        isCompleted: true,
        notified: { $ne: true },
      })
      .toArray()

    return NextResponse.json({ completedGoals })
  } catch (error) {
    console.error("Error fetching completed goals:", error)
    return NextResponse.json({ error: "Failed to fetch completed goals" }, { status: 500 })
  }
}

