import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env')
}

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

// Add the missing connectToDatabase export
export async function connectToDatabase() {
  try {
    const client = await clientPromise
    const db = client.db("health_app")
    
    // Check connection
    await db.command({ ping: 1 })
    console.log("Successfully connected to MongoDB")
    
    return { client, db }
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

// Add connection status monitoring
export async function checkDatabaseConnection() {
  try {
    const { db } = await connectToDatabase()
    const result = await db.command({ ping: 1 })
    return result.ok === 1
  } catch (error) {
    console.error("Database connection check failed:", error)
    return false
  }
}

