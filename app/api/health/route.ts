import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    // Check database connection
    const client = await clientPromise
    await client.db("health_app").command({ ping: 1 })

    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { status: 'error', error: 'Database connection failed' },
      { status: 503 }
    )
  }
} 