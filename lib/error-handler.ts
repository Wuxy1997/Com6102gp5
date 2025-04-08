import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ZodError } from "zod"

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function errorHandler(error: unknown, req: NextRequest) {
  console.error("Error:", error)

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        statusCode: error.statusCode,
        isOperational: error.isOperational
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation Error",
        details: error.errors,
        statusCode: 400
      },
      { status: 400 }
    )
  }

  // Handle MongoDB errors
  if (error instanceof Error && error.name === "MongoError") {
    return NextResponse.json(
      {
        error: "Database Error",
        message: error.message,
        statusCode: 500
      },
      { status: 500 }
    )
  }

  // Default error
  return NextResponse.json(
    {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      statusCode: 500
    },
    { status: 500 }
  )
}

// Error handling middleware
export function withErrorHandler(handler: Function) {
  return async function (req: NextRequest, ...args: any[]) {
    try {
      return await handler(req, ...args)
    } catch (error) {
      return errorHandler(error, req)
    }
  }
} 