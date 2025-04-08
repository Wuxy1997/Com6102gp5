import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"

export async function POST() {
  try {
    const sessionId = cookies().get("sessionId")?.value

    console.log("Logout attempt, session ID:", sessionId)

    if (sessionId) {
      // Delete session from database
      const client = await clientPromise
      const db = client.db("health_app")
      await db.collection("sessions").deleteOne({ _id: sessionId })
      console.log("Session deleted from database")
    }

    // Delete cookie
    cookies().delete("sessionId")
    console.log("Session cookie deleted")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}

