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

    // Get user settings
    const user = await db.collection("users").findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return settings or default values
    return NextResponse.json({
      theme: user.settings?.theme || "system",
      emailNotifications: user.settings?.emailNotifications !== false, // Default to true
      pushNotifications: user.settings?.pushNotifications !== false, // Default to true
      weeklyReports: user.settings?.weeklyReports !== false, // Default to true
      dataSharing: user.settings?.dataSharing === true, // Default to false
      units: user.settings?.units || "metric",
      language: user.settings?.language || "en",
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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

    // Validate theme
    if (data.theme && !["light", "dark", "system"].includes(data.theme)) {
      return NextResponse.json({ error: "Invalid theme value" }, { status: 400 })
    }

    // Validate units
    if (data.units && !["metric", "imperial"].includes(data.units)) {
      return NextResponse.json({ error: "Invalid units value" }, { status: 400 })
    }

    // Validate language
    const supportedLanguages = ["en", "es", "fr", "de", "zh"]
    if (data.language && !supportedLanguages.includes(data.language)) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 })
    }

    // Update user settings
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.userId) },
      {
        $set: {
          "settings.theme": data.theme || "system",
          "settings.emailNotifications": data.emailNotifications !== false,
          "settings.pushNotifications": data.pushNotifications !== false,
          "settings.weeklyReports": data.weeklyReports !== false,
          "settings.dataSharing": data.dataSharing === true,
          "settings.units": data.units || "metric",
          "settings.language": data.language || "en",
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

