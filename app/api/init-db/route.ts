import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("Initializing database...")
    const client = await clientPromise
    const db = client.db("health_app")

    // Create collections if they don't exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    const requiredCollections = ["users", "sessions", "health_data", "exercise_data", "ai_conversations"]

    for (const collection of requiredCollections) {
      if (!collectionNames.includes(collection)) {
        await db.createCollection(collection)
        console.log(`Created collection: ${collection}`)
      }
    }

    // Check if test user exists
    const testUser = await db.collection("users").findOne({ email: "test@example.com" })

    if (!testUser) {
      // Create test user
      const hashedPassword = await bcrypt.hash("password123", 10)

      await db.collection("users").insertOne({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        createdAt: new Date(),
        healthData: [],
        exerciseData: [],
      })

      console.log("Created test user: test@example.com / password123")
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      testUser: {
        email: "test@example.com",
        password: "password123",
      },
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json({ error: "Database initialization failed" }, { status: 500 })
  }
}

