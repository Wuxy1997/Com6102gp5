import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

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

    const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN

    response.cookies.set("sessionId", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
      domain,
    })

    console.log("Cookie set successfully")
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed, please try again later" }, { status: 500 })
  }
}

