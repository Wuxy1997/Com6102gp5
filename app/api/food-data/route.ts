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

    // Get user's food data
    const foodData = await db
      .collection("food_data")
      .find({ userId: session.userId })
      .sort({ date: -1 })
      .limit(30)
      .toArray()

    return NextResponse.json(foodData)
  } catch (error) {
    console.error("Error fetching food data:", error)
    return NextResponse.json({ error: "Failed to fetch food data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const data = await request.json()

    // Validate data
    if (!data.foodName || !data.calories) {
      return NextResponse.json({ error: "Food name and calories are required" }, { status: 400 })
    }

    // Save food data
    const foodData = {
      userId: session.userId,
      date: new Date(data.date || new Date()),
      foodName: data.foodName,
      calories: Number(data.calories),
      mealType: data.mealType || "other", // breakfast, lunch, dinner, snack, other
      servingSize: data.servingSize || "1 serving",
      protein: data.protein ? Number(data.protein) : null,
      carbs: data.carbs ? Number(data.carbs) : null,
      fat: data.fat ? Number(data.fat) : null,
      notes: data.notes || "",
      createdAt: new Date(),
    }

    const result = await db.collection("food_data").insertOne(foodData)

    // Update user's latest food data
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(session.userId) }, { $set: { latestFoodData: foodData } })

    // Check for achievements
    try {
      // Call the achievements endpoint to check for new achievements
      await fetch(`${request.headers.get("origin")}/api/achievements`, {
        method: "POST",
        headers: {
          Cookie: `sessionId=${sessionId}`,
        },
      })
    } catch (error) {
      console.error("Error checking achievements:", error)
      // Don't fail the request if achievement check fails
    }

    return NextResponse.json({
      _id: result.insertedId,
      ...foodData,
    })
  } catch (error) {
    console.error("Error saving food data:", error)
    return NextResponse.json({ error: "Failed to save food data" }, { status: 500 })
  }
}

