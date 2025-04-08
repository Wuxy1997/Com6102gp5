import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Please provide email and password" }, { status: 400 })
    }

    console.log(`Login attempt for email: ${email}`)

    const client = await clientPromise
    const db = client.db("health_app")
    const usersCollection = db.collection("users")

    // Find user
    const user = await usersCollection.findOne({ email })

    console.log(`User found: ${user ? "Yes" : "No"}`)

    if (!user) {
      console.log("Invalid email - user not found")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    console.log(`Password valid: ${isPasswordValid ? "Yes" : "No"}`)

    if (!isPasswordValid) {
      console.log("Invalid password")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create session
    const sessionId = new ObjectId().toString()
    const session = {
      _id: sessionId,
      userId: user._id.toString(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }

    await db.collection("sessions").insertOne(session)
    console.log(`Session created with ID: ${sessionId}`)

    // Set cookie with proper domain and secure settings
    const response = NextResponse.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    })

    // Get request headers
    const host = request.headers.get("host") || ""
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    console.log(`Setting cookie for ${protocol}://${host}`)

    response.cookies.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("Cookie set successfully")
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed, please try again later" }, { status: 500 })
  }
}

// Add GET method to handle NextAuth session check
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("health_app")
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication check failed" }, { status: 500 })
  }
}

